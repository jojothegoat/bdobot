<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
         Commands\PatchVersion::class,
         Commands\LauncherVersion::class,
         Commands\Login::class,
         Commands\RSS::class,
         Commands\InGame::class,
         Commands\NewsReader::class,
         Commands\YouTube::class,
         Commands\Events::class
    ];

    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('bdo:login')->everyMinute();
        
        $schedule->command('bdo:patchversion')->everyMinute();
        $schedule->command('bdo:launcherversion')->everyMinute();
        
        $schedule->command('bdo:ingame')->everyMinute();
        //$schedule->command('bdo:events')->everyMinute();
        $schedule->command('bdo:news')->everyMinute();
        $schedule->command('bdo:rss')->everyMinute();
        $schedule->command('bdo:youtube')->everyMinute();
        
        
        /*$schedule->command('bdo:guildrank eu 400')->hourly();
        $schedule->command('bdo:guildrank na 500')->hourly();
        $schedule->command('bdo:guild eu 400')->hourly();
        $schedule->command('bdo:guild na 500')->hourly();*/
    }
}
