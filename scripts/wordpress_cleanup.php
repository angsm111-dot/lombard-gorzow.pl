<?php
// Dedicated migration task. Never load WordPress or print database credentials.
ini_set('display_errors', '0');
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
$root = '/home/lombardg/public_html';
$mode = $argv[1] ?? 'audit';
if (!in_array($mode, ['audit', 'remove'], true) || realpath($root) !== $root) {
    fwrite(STDERR, "Nieprawidłowy tryb lub katalog.\n"); exit(1);
}

function literal($value) {
    $quote = $value[0];
    $value = substr($value, 1, -1);
    if ($quote === "'") return str_replace(["\\'", "\\\\"], ["'", "\\"], $value);
    if (str_contains($value, '$')) throw new Exception('Dynamiczna konfiguracja wymaga osobnego sprawdzenia.');
    return stripcslashes($value);
}

function removePath($path) {
    if (is_link($path) || is_file($path)) {
        if (!unlink($path)) throw new Exception('Nie udało się usunąć pliku.');
    } elseif (is_dir($path)) {
        foreach (new DirectoryIterator($path) as $entry) {
            if (!$entry->isDot()) removePath($entry->getPathname());
        }
        if (!rmdir($path)) throw new Exception('Nie udało się usunąć katalogu.');
    }
}

try {
    if (!is_file($root . '/index.html') || !is_file($root . '/deployment-version.txt')) {
        throw new Exception('Nie potwierdzono nowej strony — przerwano.');
    }
    $files = [];
    foreach (['wp-admin', 'wp-includes', 'wp-content', 'xmlrpc.php', 'readme.html', 'license.txt', '.maintenance', 'wordfence-waf.php'] as $name) {
        if (file_exists($root . '/' . $name) || is_link($root . '/' . $name)) $files[] = $name;
    }
    foreach (glob($root . '/wp-*.php') as $path) $files[] = basename($path);
    $files = array_values(array_unique($files));
    echo 'Tryb: ' . $mode . "\nRozpoznane pliki i katalogi WordPressa: " . json_encode($files) . "\n";
    echo "Pozostałe nazwy w katalogu publicznym (bez zawartości):\n";
    echo json_encode(array_values(array_diff(scandir($root), ['.', '..']))) . "\n";
    $tables = [];
    $db = null;
    if (is_file($root . '/wp-config.php')) {
        $config = file_get_contents($root . '/wp-config.php');
        $string = "('(?:\\\\.|[^'\\\\])*'|\"(?:\\\\.|[^\"\\\\])*\")";
        $settings = [];
        foreach (['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as $key) {
            if (!preg_match('/define\s*\(\s*[\'\"]' . $key . '[\'\"]\s*,\s*' . $string . '\s*\)/', $config, $match)) {
                throw new Exception('Nie można bezpiecznie odczytać ustawień bazy.');
            }
            $settings[$key] = literal($match[1]);
        }
        if (!preg_match('/\$table_prefix\s*=\s*' . $string . '\s*;/', $config, $match)) {
            throw new Exception('Nie ustalono prefiksu tabel.');
        }
        $prefix = literal($match[1]);
        if (!preg_match('/^[A-Za-z0-9_]+$/D', $prefix)) throw new Exception('Nietypowy prefiks tabel.');
        $host = $settings['DB_HOST']; $port = 3306; $socket = null;
        if (preg_match('/^([^:]+):(\d+)$/', $host, $match)) { $host = $match[1]; $port = (int)$match[2]; }
        elseif (preg_match('/^([^:]+):(\/.*)$/', $host, $match)) { $host = $match[1]; $socket = $match[2]; }
        try {
            $db = new mysqli($host, $settings['DB_USER'], $settings['DB_PASSWORD'], $settings['DB_NAME'], $port, $socket);
            $allTables = array_column($db->query('SHOW TABLES')->fetch_all(MYSQLI_NUM), 0);
        } catch (Throwable $error) {
            throw new Exception('Brak połączenia z bazą WordPressa; danych dostępu nie wypisano.');
        }
        $tables = array_values(array_filter($allTables, fn($name) => str_starts_with($name, $prefix)));
        foreach ($tables as $table) if (!preg_match('/^[A-Za-z0-9_]+$/D', $table)) throw new Exception('Nietypowa nazwa tabeli.');
        if (count($tables) && (!in_array($prefix . 'options', $tables) || !in_array($prefix . 'posts', $tables))) {
            throw new Exception('Nie potwierdzono tabel głównych WordPressa.');
        }
        echo 'Tabele tej instalacji WordPressa: ' . count($tables) . "\n";
        echo 'Inne tabele pozostawiane bez zmian: ' . (count($allTables) - count($tables)) . "\n";
    } else {
        echo "Brak wp-config.php — brak możliwości ustalenia bazy; nie wykonuje się operacji na bazach.\n";
    }
    if ($mode === 'audit') { echo "Odczyt zakończony. Niczego nie usunięto.\n"; exit(0); }
    // User explicitly requested full removal and already has a server backup.
    if ($db && count($tables)) {
        $db->query('SET FOREIGN_KEY_CHECKS=0');
        try {
            foreach ($tables as $table) $db->query('DROP TABLE `' . $table . '`');
        } finally { $db->query('SET FOREIGN_KEY_CHECKS=1'); }
        $remaining = array_column($db->query('SHOW TABLES')->fetch_all(MYSQLI_NUM), 0);
        foreach ($remaining as $table) if (str_starts_with($table, $prefix)) throw new Exception('Pozostały tabele WordPressa.');
        echo 'Usunięto tabel WordPressa: ' . count($tables) . ". Nie usuwano innych tabel ani kont baz danych.\n";
    }
    foreach ($files as $name) { removePath($root . '/' . $name); echo 'Usunięto: ' . $name . "\n"; }
    $retired = dirname($root) . '/.codex-wordpress-index.php';
    if (is_file($retired)) {
        if (!str_contains(file_get_contents($retired), 'wp-blog-header.php')) throw new Exception('Nieznany wyłączony plik index — pozostawiono.');
        unlink($retired);
        echo "Usunięto wcześniej wyłączony plik startowy WordPressa.\n";
    }
    if (is_file($root . '/index.php')) {
        if (str_contains(file_get_contents($root . '/index.php'), 'wp-blog-header.php')) unlink($root . '/index.php');
        else throw new Exception('Nieznany index.php pozostawiono.');
    }
    foreach (['wp-admin', 'wp-includes', 'wp-content', 'wp-config.php', 'wp-login.php', 'xmlrpc.php'] as $name) {
        if (file_exists($root . '/' . $name)) throw new Exception('Nie usunięto wszystkich wskazanych plików WordPressa.');
    }
    echo "Potwierdzono usunięcie rozpoznanej instalacji WordPressa. Nowe HTML, assets, blog i .well-known pozostawiono.\n";
} catch (Throwable $error) {
    // No raw mysqli exceptions, backtraces, configuration or credentials in logs.
    $allowed = ['Nieprawidłowy', 'Nie potwierdzono', 'Nie można', 'Nie ustalono', 'Nietypowy', 'Nietypowa', 'Brak połączenia', 'Pozostały', 'Nie udało', 'Nieznany', 'Nie usunięto', 'Dynamiczna'];
    $message = $error->getMessage();
    $safe = false;
    foreach ($allowed as $start) if (str_starts_with($message, $start)) $safe = true;
    fwrite(STDERR, ($safe ? $message : 'Operacja nie powiodła się; szczegóły połączenia ukryto.') . "\n"); exit(1);
}
