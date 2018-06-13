<?php

namespace App\Console\Commands;

use DB;
use Redis;
use Illuminate\Console\Command;
use App\Regions;
use App\BotChannels;
use DateTime;
use DateInterval;

class Guilds extends Command {

    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bdo:guild {region=eu} {id=400}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fetch all Guilds';
    private $certKey = '';
    private $url = null;

    /**
     * Create a new command instance.
     *
     * @return void
     */
    public function __construct() {
        parent::__construct();
    }

    private function getGuildInfo($guildNo) {
        $url = $this->url . "?userNo=&guildNo=$guildNo&certKey=$this->certKey";
        echo $url;
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        $return = curl_exec($ch);
        if (curl_errno($ch)) {
            $this->error(curl_error($ch));
        }
        if (preg_match("/var data = ({.*});/", $return, $m)) {
            $data = json_decode($m[1]);
            if (count($data->guildInfoList)) {
                $guildInfo = $data->guildInfoList[0];
                return $guildInfo;
            }
        }
        return 0;
    }

    private function guildToArray($id, $guildInfo) {
        $regions = explode(',', $guildInfo->C_regionKey);
        return [
            'id' => $id,
            'guild_name' => $guildInfo->C_guildName,
            'created_at' => date("Y-m-d H:i:s", substr($guildInfo->C_registerDate, 6, -5)),
            'master_user_no' => $guildInfo->C_masterUserNo,
            'master_user_nickname' => $guildInfo->C_masterUserNickname,
            'aquired_skill_point' => $guildInfo->C_aquiredSkillPoint,
            'guild_member' => $guildInfo->C_guildMember,
            'territory_key' => intval($guildInfo->C_territoryKey),
            'region_key' => $guildInfo->C_regionKey,
            'region_key1' => (isset($regions[0]) ? intval($regions[0]) : 0),
            'region_key2' => (isset($regions[1]) ? intval($regions[1]) : 0),
            'region_key3' => (isset($regions[2]) ? intval($regions[2]) : 0),
            //'region_key4' => (isset($regions[3]) ? intval($regions[3]) : 0),
        ];
    }

    private function updateGuild($new, $guild) {
        // SHOW DIFF
        if($guild) {
            $old = get_object_vars($guild);
            unset($old['updated_at']);
            $diff = array_diff_assoc($new, $old);
            $changes = count($diff);
            if ($changes) {
                DB::table('guilds_' . $this->server)->where('id', $guild->id)->update($new);
                $old['guild_id'] = $old['id'];
                unset($old['id']);
                DB::table('guilds_history_' . $this->server)->insert($old);
            } else {
                $this->line("No Guild Changes");
                DB::table('guilds_' . $this->server)->where('id', $guild->id)->update(['updated_at' => date("Y-m-d H:i:s")]);
            }
        } else {
            DB::table('guilds_' . $this->server)->insert($new);
        }
    }

    /**
     * Execute the console command.
     *
     * @return mixed
     */
    public function handle() {
        $this->server = $this->argument('region');
        $this->id = $this->argument('id');
        $this->url = 'https://gameweb-' . $this->server . $this->id . '.blackdesertonline.com/Guildinfo/';
        $err = 0;
        // UPDATE GUILD DATA
        $guildNos = DB::table('guildrank_' . $this->server)->groupBy('guildNo')->lists('guildNo');
        $this->line(count($guildNos) . " Guilds to update..");
        foreach ($guildNos as $id) {
            $guildInfo = $this->getGuildInfo($id);
            if ($guildInfo) {
                $this->line("Updating Guild: $guildInfo->C_guildName ($id)");
                $guild = DB::table('guilds_' . $this->server)->find($id);
                $this->updateGuild($this->guildToArray($id, $guildInfo), $guild);
            } else {
                $this->line("Guild no longer exists: $id");
            }
        }
    }

}
