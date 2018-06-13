<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use DB;
use Log;

class GuildRank extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bdo:guildrank {region=eu} {id=400}';
    private $server = null;
    private $url = null;
    private $index = null;
    private $grt = null;
    private $grht = null;

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch Guildrankings';

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
        $this->server = $this->argument('region');
        $this->id = $this->argument('id');
        $this->url = 'https://gameweb-'.$this->server.$this->id.'.blackdesertonline.com/GuildRank/';
        $this->auth();
        $this->fetch_guild('rank');
        $this->fetch_guild('life');
        $this->info("Done!");
    }

    private function fetch_guild($rank) {
        for($type=0; $type< ($rank == 'life' ? 9 : 6); $type++) {
            $this->info("Get $rank Ranking ($type)...");
            $page = 1;
            do {
                $result = $this->get_guild_list($rank, $page, 255, $type);
                $this->parse($rank, $type, $result['guildRankList']);
                $page++;
            } while ($page <= $result['totalPage']);
        }
    }

    private function parse($rank, $type, $guildRankList)
    {
        $this->info("Parsing $rank Ranking ($type)...");
        foreach($guildRankList as $guild) {
            foreach($guild as $k => $v) {
                $new_key = str_replace('C_', '', $k);
                $guild[$new_key] = $v;
                unset($guild[$k]);
            }
            $guild['guildNo'] = $guild['guildNo'];
            $guild['rankingType'] = $type;
            $guild['isIntroduction'] = intval($guild['isIntroduction']);
            $old = DB::table("guild".$rank."_$this->server")->where('rank', intval($guild['rank']))->where('rankingType', $type)->first();
            if($old) {
                $vars = get_object_vars($old);
                $diff = array_diff_assoc($guild, $vars);
                $changes = count($diff);
                if($changes)
                {
                    $this->line("" .  $guild['guildName'] . " changed:");
                    foreach($diff as $key => $val)
                    {
                        $this->line("Guild Change: $key => $val");
                    }
                    $guild['created_at'] = date("Y-m-d H:i:s");
                    DB::table("guild".$rank."_$this->server")->where('id', $old->id)->update($guild);
                    unset($vars['id']);
                    DB::table("guild".$rank."_history_$this->server")->insert($vars);
                } else {
                    //$this->line("No Rank Change.");
                    DB::table("guild".$rank."_$this->server")->where('id', $old->id)->update(['updated_at' => date("Y-m-d H:i:s")]);
                }
                
            } else {
                $this->line("Adding " .  $guild['guildName'] . ".");
                DB::table("guild".$rank."_$this->server")->insert($guild);
            }
        }
    }
    
    private function get_guild_list($rank, $page = 1, $pageLength = 17, $rankingType = 0) {
        $url = $this->url ."Index/GetGuildRankList";
        if($rank == 'life') {
            $url = $this->url ."Index/GetGuildLifeRankList";
        }
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_COOKIEJAR => $this->server.".cookies",
            CURLOPT_COOKIEFILE => $this->server.".cookies",
            CURLOPT_SSL_VERIFYHOST => false,
            CURLOPT_POST => true,
            CURLINFO_HEADER_OUT => true,
            CURLOPT_POSTFIELDS => "page=$page&pageLength=$pageLength&rankingType=$rankingType",
            CURLOPT_HTTPHEADER => ["X-Requested-With: XMLHttpRequest"]
        ]);
        $return = curl_exec($ch);
        
        if(curl_errno($ch))
        {
            $this->error_msg(curl_error($ch));
        }
        curl_close($ch);

        return json_decode($return, true);
    }
    
    private function auth()
    {
        $this->info("Authenticate...");
        $url = $this->url ."?userNo=&certKey=";
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_COOKIEJAR => $this->server.".cookies",
            CURLOPT_COOKIEFILE => $this->server.".cookies",
            CURLOPT_SSL_VERIFYHOST => false
        ]);
        curl_exec($ch);
        if(curl_errno($ch))
        {
            $this->error_msg(curl_error($ch));
        }
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        if($http_code != 302) {
            $this->error_msg('GuildRank Auth: '.$http_code);
        }
        
        $this->info("Authentication successfull!");
        return 1;
    }
    
    private function error_msg($msg)
    {
        $this->error($msg);
        Log::error($msg);
        exit(1);
    }
}
