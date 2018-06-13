<?php

$lang = 'EN';
if (filter_input(INPUT_GET, 'lang', FILTER_VALIDATE_REGEXP, ["options" => ["regexp" => "/^(en|de|fr)$/i"]])) {
    $lang = strtoupper(filter_input(INPUT_GET, 'lang'));
}

$page = filter_input(INPUT_GET, 'page', FILTER_SANITIZE_NUMBER_INT);
if (!$page) {
    $page = 0;
}

$output = apcu_fetch('xml' . $lang . $page, $cached);
if (!$cached) {
    include('simple_html_dom.php');
    define('URL_PREFIX', 'https://www.blackdesertonline.com');
    define('URL_SUFFIX', '?lang=');

    header('Content-Type: application/rss+xml');

    switch ($lang) {
        case 'DE': $local = 'de_DE';
            break;
        case 'FR': $local = 'fr_FR';
            break;
        default: $local = 'en_US';
    }
    $fmt = new IntlDateFormatter($local, IntlDateFormatter::FULL, IntlDateFormatter::FULL, 'UTC', IntlDateFormatter::GREGORIAN, "dd MMMM yyyy HH:mm");
    $html = file_get_html('https://www.blackdesertonline.com/news/list/?page=' . $page . '&lang=' . $lang, 0, null, -1, -1, 1, 1, DEFAULT_TARGET_CHARSET, 0);

    $list_news = $html->find('ul.list_news_type2', 0);
    $list_news_items = $list_news->find('li');

    $xml = new DOMDocument('1.0');
    $xml->formatOutput = true;

    $xml_rss = $xml->createElement('rss');
    $xml_rss->setAttribute("version", "2.0");
    $xml_channel = $xml->createElement('channel');
    $xml_title = $xml->createElement("title", "Black Desert Online News");
    $xml_channel->appendChild($xml_title);

    $xml_link = $xml->createElement("link", "https://www.blackdesertonline.com/news/list/");
    $xml_channel->appendChild($xml_link);

    $xml_description = $xml->createElement("description", "The RSS2 Feed for Black Desert Online News");
    $xml_channel->appendChild($xml_description);

    $xml_language = $xml->createElement("language", $lang);
    $xml_channel->appendChild($xml_language);

    $xml_ttl = $xml->createElement("ttl", 60);
    $xml_channel->appendChild($xml_ttl);

    foreach ($list_news_items as $news_item) {
        $link = URL_PREFIX . $news_item->find('a.link_news', 0)->href . URL_SUFFIX . $lang;
        $filter = trim($list_news->find('em.txt_filter', 0)->plaintext);
        $img = $news_item->find('img.thumb_img', 0)->src;
        $title = trim($news_item->find('strong.tit_news', 0)->plaintext);
        $time = trim($news_item->find('span.txt_time', 0)->plaintext);
        $time_parsed = $fmt->parse($time);
        $news = $news_item->find('span.txt_news', 0)->innertext;

        $xml_item = $xml->createElement("item");
        $xml_title = $xml->createElement("title", $title);
        $xml_item->appendChild($xml_title);
        $xml_link = $xml->createElement("link", $link);
        $xml_item->appendChild($xml_link);

        $xml_description = $xml->createElement("description", $news);
        $xml_item->appendChild($xml_description);

        $xml_category = $xml->createElement("category", $filter);
        $xml_item->appendChild($xml_category);

        $xml_pubDate = $xml->createElement("pubDate", date(DateTime::RSS, $time_parsed));
        $xml_item->appendChild($xml_pubDate);

        $xml_image = $xml->createElement("enclosure");
        if (!filter_var($img, FILTER_VALIDATE_URL, FILTER_FLAG_HOST_REQUIRED)) {
            $img = 'https://akamai-webcdn.blackdesertonline.com/web' . $img;
        }
        $xml_image->setAttribute("url", $img);
        $xml_image->setAttribute("type", "image/png");
        $xml_item->appendChild($xml_image);
        $xml_channel->appendChild($xml_item);
    }
    $xml_rss->appendChild($xml_channel);
    $xml->appendChild($xml_rss);

    $output = $xml->saveXML();
    apcu_store('xml' . $lang . $page, $output, 60);
}
echo $output;
