<?php

namespace App\Console\Commands;

use Log;
use Redis;
use Illuminate\Console\Command;
use App\MaintenanceMsgs;
use App\LoginStates;
use App\BotChannels;

class Login extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bdo:login';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Login Status';

    private $html_url = "https://www.blackdesertonline.com/launcher/ll/Launcher.html";
    private $login_url = "https://www.blackdesertonline.com/launcher/ll/api/Login.json";
    private $play_url = "https://www.blackdesertonline.com/launcher/I/api/CreatePlayToken.json";
    private $email = "";
    private $password = "";
    
    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle()
    {
        $mmsg = $this->maintenance_msg();
        if($token = $this->login())
        {
            if($this->play($token))
            {
                $this->login_status(1);
                exit(0);
            }
        }
        
        $this->login_status(0, $mmsg);
    }
    
    private function login_status($state, $msg = "") {
        $embed = [
            "color" => $state ?  0x00c000 : 0xc00000,
            "author" => [
                "name" => "BDOBot Status"
            ],
            "title" => "Login: " . ($state ? "Online" : "Offline"),
            "description" => $msg
        ];
        $last = LoginStates::orderBy('updated_at', 'desc')->first();
        $last_state = isset($last->state) ? $last->state : -1;
        if($last_state != $state)
        {
            for($i=1;$i<4;$i++) {
                $channels = BotChannels::where('notify_login', $i)->pluck('channel_id');
                $counter = Redis::publish('discord', 
                  json_encode(['message' => "**Status Notification**", 'channels' => $channels, 'type' => $i, 'embed' => $embed])
                );
            }
            LoginStates::insert(['state' => $state]);
        } else {
            $last->touch();
        }
    }
    
    private function play($token)
    {
        $this->info("Play...");
        $ch = curl_init($this->play_url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => "token=$token"
        ]);
        $json = curl_exec($ch);
        if(curl_errno($ch))
        {
            $this->error_msg("Curl: " . curl_error($ch));
        }
        curl_close($ch);
        
        $data = json_decode($json);
        if(!isset($data))
        {
            $this->error_msg(json_last_error_msg());
        }

        $this->info("Play: " . $data->api->codeMsg);
        
        switch($data->api->code)
        {
            case 100:
                return $data->result->token;
                break;
            case 415:
                return NULL;
                break;
            case 801:
                if($data->api->additionalInfo->code == 415) {
                    return NULL;
                }
                $this->error_msg("Play Error: " . $data->api->additionalInfo->msg);
                break;
            default:
                $this->error_msg("Play Error: " . $data->api->codeMsg);
        }
    }
    
    private function login()
    {
        $this->info("Login...");
        $ch = curl_init($this->login_url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => "email=$this->email&password=$this->password"
        ]);
        $json = curl_exec($ch);
        if(curl_errno($ch))
        {
            $this->error_msg("Curl: " . curl_error($ch));
        }
        curl_close($ch);
        
        $data = json_decode($json);
        if(!isset($data))
        {
            $this->error_msg(json_last_error_msg());
        }

        $this->info("Login: " . $data->api->codeMsg);
        switch($data->api->code)
        {
            case 100:
                return $data->result->token;
                break;
            case 415:
                return NULL;
                break;
            case 801:
                if($data->api->additionalInfo->code == 415) {
                    return NULL;
                }
                $this->error_msg("Login Error: " . $data->api->additionalInfo->msg);
                break;
            default:
                $this->error_msg("Login Error: " . $data->api->codeMsg);
        }
        
        return NULL;
    }
    
    private function maintenance_msg()
    {
        $msg = $this->get_maintenance_msg();
        $embed = [
            "color" => 0xc0c000,
            "author" => [
                "name" => "BDOBot Status"
            ],
            "title" => "Maintenance Message updated",
            "description" => $msg
        ];
        $this->info("Maintenance Msg: $msg");
        
        $last = MaintenanceMsgs::orderBy('updated_at', 'desc')->first();
        $lastmsg = isset($last->msg) ? $last->msg : "-";

        if($lastmsg != $msg)
        {
            $alert = "__Maintenance Message updated:__\n$msg";
            $counter = Redis::publish('alert', $alert);
            MaintenanceMsgs::insert(['msg' => $msg]);
            $this->info("Maintenance Msg saved!");
    		$last = LoginStates::orderBy('updated_at', 'desc')->first();
    		if($last->state == 0) {
	            for($i=1;$i<4;$i++) {
	                $channels = BotChannels::where('notify_login', $i)->pluck('channel_id');
	                $counter = Redis::publish('discord', 
	                  json_encode(['message' => "**Status Notification**", 'channels' => $channels, 'type' => $i, 'embed' => $embed])
	                );
	            }
    		}
        } else {
            $last->touch();
        }
        
        return $msg;
    }
    
    private function get_maintenance_msg()
    {
        $this->info("Read Maintenance Msg...");
        $ch = curl_init($this->html_url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYHOST => false
        ]);
        $return = curl_exec($ch);
        if(curl_errno($ch))
        {
            $this->error_msg("Curl: " . curl_error($ch));
        }
        curl_close($ch);
        
        if(!preg_match("/'error_maintenance':\"(.*)\"/", $return, $matches))
        {
            $this->error_msg("Maintenance Msg Not Found");
        }
        
        return $matches[1];
    }
    
    private function error_msg($msg)
    {
        $this->error($msg);
        // Log::error($msg);
        exit(1);
    }
}
