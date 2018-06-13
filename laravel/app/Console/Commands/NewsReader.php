<?php

namespace App\Console\Commands;

use Symfony\Component\DomCrawler\Crawler;
use Illuminate\Console\Command;
use IntlDateFormatter;
use App\BdoNews;
use App\BotChannels;
use Redis;


class NewsReader extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bdo:news';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'BDO Homepage Parser';
    protected $news_url = "https://www.blackdesertonline.com/news/list/?page=0&lang=";
    protected $url_prefix = "https://www.blackdesertonline.com";
    protected $url_suffix = "?lang=";
    
    private $langs = ['EN', 'DE', 'FR'];

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
        foreach($this->langs as $lang) {
            $html = $this->get_html($lang);
            $this->parse_html($html, $lang);
        }
    }
    
    private function parse_html($html, $lang)
    {
        $crawler = new Crawler($html);
        $news_items = $crawler->filter('ul.list_news_type2 li');
        $this->info(count($news_items)." Newsitems received:");
        $news_items->each(function($news_item, $i) use ($lang) {
            $news = [];
            $fmt = new IntlDateFormatter('en_US', IntlDateFormatter::FULL,
                IntlDateFormatter::FULL, 'UTC', IntlDateFormatter::GREGORIAN,
                "dd MMMM yyyy HH:mm");
            if(preg_match("/(\d+)/",$news_item->filter('a.link_news')->first()->attr('href'), $m)) {
                $news['news_id'] = intval($m[1]);
            }
            $news['link'] = $this->url_prefix . $news_item->filter('a.link_news')->first()->attr('href') . $this->url_suffix . $lang;
            $news['filter'] = trim($news_item->filter('em.txt_filter')->first()->text());
            $news['img'] = trim($news_item->filter('img.thumb_img')->first()->attr('src'));
            $news['title'] = trim($news_item->filter('strong.tit_news')->first()->text());
            $news['created_at'] = date("Y-m-d H:i:s", $fmt->parse(trim($news_item->filter('span.txt_time')->first()->text())));
            $news['news'] = trim($news_item->filter('span.txt_news')->first()->text());
            NewsReader::news_parser($news, $lang);
        });
    }
    
    public function news_parser($news, $lang)
    {
        $this->line("[$lang] " . $news['title']);
        $old = BdoNews::where(['news_id' => $news['news_id']])->first();
        $filter = ucfirst(strtolower($news['filter']));
        if($old) {
            $this->info("Found!");
            $oldarr = $old->toArray();
            unset($oldarr['updated_at']);
            $diff = array_diff_assoc($news, $oldarr);
            if($diff)
            {
                //file_put_contents('diff.log', print_r($diff, 1), FILE_APPEND);
                $old->update($news);
                //$this->notify_news("**$filter has been updated**\n" . $news['link']);
            }
        } else {
            BdoNews::insert($news);
            $this->notify_news("**[$lang-News] $filter**\n" . $news['link'], $lang);
        }
    }
    
    private function get_html($lang)
    {
        $ch = curl_init($this->news_url . $lang);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYHOST => false
        ]);
        $content = curl_exec($ch);
        if(curl_errno($ch))
        {
            throw new Exception(curl_error($ch));
        }
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if($code != 200)
        {
            throw new Exception("HTTP CODE $code");
        }
        
        return $content;
    }
    
    private function notify_news($msg, $lang) {
        $this->info($msg);
        for($i=1;$i<4;$i++) {
            $channels = BotChannels::where('notify_web_' . strtolower($lang), 
                $i)->pluck('channel_id');
            $counter = Redis::publish('discord', 
              json_encode(['message' => $msg, 'channels' => $channels, 'type' => $i])
            );
        }
    }
}
