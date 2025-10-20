<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
 
        Schema::table('users', function (Blueprint $t) {
            $t->decimal('last_lat', 10, 7)->nullable()->after('remember_token');
            $t->decimal('last_lng', 10, 7)->nullable()->after('last_lat');
            $t->unsignedInteger('last_accuracy_m')->nullable()->after('last_lng');
            $t->timestamp('last_seen_at')->nullable()->after('last_accuracy_m');
            $t->index(['last_lat','last_lng']);
            $t->index('last_seen_at');
        });
    }

    public function down(): void {
        Schema::table('users', function (Blueprint $t) {
            $t->dropColumn(['last_lat','last_lng','last_accuracy_m','last_seen_at']);
        }); 
    }
};
