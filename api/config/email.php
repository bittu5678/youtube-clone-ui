<?php
/**
 * FaceTube - Production Welcome Email Delivery Service (PHP Backend)
 * Dispatches HTML welcome email with user credentials to the registered email address.
 * 
 * Delivery channels:
 *  1. SMTP (Hostinger SMTP: smtp.hostinger.com:465 SSL, Gmail SMTP: smtp.gmail.com:465 SSL)
 *  2. Native PHP mail() fallback when running on Hostinger Web Hosting
 */

require_once __DIR__ . '/database.php';

function getSmtpConfigPhp() {
    $host = getenv('SMTP_HOST') ?: ($_ENV['SMTP_HOST'] ?? ($_SERVER['SMTP_HOST'] ?? ''));
    $port = (int)(getenv('SMTP_PORT') ?: ($_ENV['SMTP_PORT'] ?? ($_SERVER['SMTP_PORT'] ?? 0)));
    $user = getenv('SMTP_USER') ?: ($_ENV['SMTP_USER'] ?? ($_SERVER['SMTP_USER'] ?? (getenv('GMAIL_USER') ?: ($_ENV['GMAIL_USER'] ?? ($_SERVER['GMAIL_USER'] ?? '')))));
    $pass = getenv('SMTP_PASS') ?: ($_ENV['SMTP_PASS'] ?? ($_SERVER['SMTP_PASS'] ?? (getenv('GMAIL_APP_PASSWORD') ?: ($_ENV['GMAIL_APP_PASSWORD'] ?? ($_SERVER['GMAIL_APP_PASSWORD'] ?? '')))));
    $secure = getenv('SMTP_SECURE') ?: ($_ENV['SMTP_SECURE'] ?? ($_SERVER['SMTP_SECURE'] ?? ''));
    $from = getenv('SMTP_FROM') ?: ($_ENV['SMTP_FROM'] ?? ($_SERVER['SMTP_FROM'] ?? ''));

    // Optional Hostinger direct configuration file for users who prefer PHP array over .env
    $customConfigPath = __DIR__ . '/smtp_credentials.php';
    if (file_exists($customConfigPath) && is_readable($customConfigPath)) {
        $custom = include $customConfigPath;
        if (is_array($custom)) {
            $host = $custom['SMTP_HOST'] ?? $host;
            $port = (int)($custom['SMTP_PORT'] ?? $port);
            $user = $custom['SMTP_USER'] ?? ($custom['GMAIL_USER'] ?? $user);
            $pass = $custom['SMTP_PASS'] ?? ($custom['GMAIL_APP_PASSWORD'] ?? $pass);
            $secure = $custom['SMTP_SECURE'] ?? $secure;
            $from = $custom['SMTP_FROM'] ?? $from;
        }
    }

    // Strip quotes and spaces from password (common with 16-char Google App Passwords)
    $pass = trim((string)$pass, " \t\n\r\0\x0B\"'");
    $pass = str_replace(' ', '', $pass);
    $user = trim((string)$user, " \t\n\r\0\x0B\"'");
    $host = trim((string)$host, " \t\n\r\0\x0B\"'");

    if (empty($port)) {
        $port = 465;
    }

    if (empty($host)) {
        if (!empty($user) && str_ends_with(strtolower($user), '@gmail.com')) {
            $host = 'smtp.gmail.com';
        } else {
            $host = 'smtp.hostinger.com';
        }
    }

    if (empty($from)) {
        $from = !empty($user) ? "FaceTube <{$user}>" : "FaceTube <noreply@facetube.online>";
    }

    $isConfigured = !empty($user) && !empty($pass);
    $missingFields = [];
    if (empty($user)) $missingFields[] = 'SMTP_USER';
    if (empty($pass)) $missingFields[] = 'SMTP_PASS';

    return [
        'host' => $host,
        'port' => $port,
        'user' => $user,
        'pass' => $pass,
        'secure' => ($secure !== '' ? strtolower((string)$secure) !== 'false' : ($port === 465)),
        'from' => $from,
        'configured' => $isConfigured,
        'missingFields' => $missingFields
    ];
}

function maskEmailForLog($email) {
    if (empty($email)) return 'EMPTY';
    $parts = explode('@', $email, 2);
    if (count($parts) === 2) {
        $prefix = substr($parts[0], 0, 2) . '***';
        return $prefix . '@' . $parts[1];
    }
    return substr($email, 0, 3) . '***';
}

function generateWelcomeEmailHtmlPhp($name, $email, $userId, $loginLink = 'https://facetube.online/login') {
    $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    $safeUserId = htmlspecialchars($userId, ENT_QUOTES, 'UTF-8');
    $safeLoginLink = htmlspecialchars($loginLink ?: 'https://facetube.online/login', ENT_QUOTES, 'UTF-8');

    return <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to FaceTube</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0f12;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#0f0f12;padding:40px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px;background-color:#18181b;border:1px solid #27272a;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:linear-gradient(135deg,#e11d48,#be123c);padding:28px 32px;text-align:left;">
              <span style="font-size:24px;font-weight:900;letter-spacing:-0.5px;color:#ffffff;">FaceTube</span>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 24px 32px;">
              <h1 style="margin:0 0 12px 0;font-size:22px;font-weight:800;color:#ffffff;">Welcome to FaceTube!</h1>
              <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#a1a1aa;">
                Hello <strong style="color:#ffffff;">{$safeName}</strong>,<br>
                Your FaceTube account has been created successfully.
              </p>

              <!-- Account Details (Passwords are strictly omitted for security) -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#27272a;border:1px solid #3f3f46;border-radius:12px;margin:20px 0 24px 0;">
                <tr>
                  <td style="padding:20px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#e11d48;margin-bottom:12px;">Your Account Details</div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:14px;color:#e4e4e7;">
                      <tr><td width="35%" style="color:#a1a1aa;padding:6px 0;">Full Name:</td><td style="font-weight:600;color:#ffffff;padding:6px 0;">{$safeName}</td></tr>
                      <tr><td width="35%" style="color:#a1a1aa;padding:6px 0;">User ID:</td><td style="font-family:monospace;font-weight:700;color:#f43f5e;font-size:15px;padding:6px 0;">{$safeUserId}</td></tr>
                      <tr><td width="35%" style="color:#a1a1aa;padding:6px 0;">Registered Email:</td><td style="font-weight:500;color:#ffffff;padding:6px 0;">{$safeEmail}</td></tr>
                      <tr><td width="35%" style="color:#a1a1aa;padding:6px 0;">Account Status:</td><td style="font-weight:600;color:#34d399;padding:6px 0;">Active (Password Encrypted)</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Safe Account Access Instructions -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#1c1c20;border:1px dashed #3f3f46;border-radius:12px;margin:0 0 24px 0;">
                <tr>
                  <td style="padding:18px 20px;">
                    <div style="font-size:12px;font-weight:700;color:#f43f5e;margin-bottom:8px;">How to Access Your Account:</div>
                    <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.7;color:#d4d4d8;">
                      <li>Log in at <strong>{$safeLoginLink}</strong> using your <strong>User ID ({$safeUserId})</strong> or <strong>Registered Email ({$safeEmail})</strong>.</li>
                      <li>Use the confidential password you created during signup.</li>
                      <li>For your security, passwords are encrypted and never transmitted via email.</li>
                      <li>Keep your credentials private. If you ever forget your password, you can request a secure reset directly from the login page.</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:24px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="{$safeLoginLink}" target="_blank" rel="noopener noreferrer" style="background-color:#e11d48;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;display:inline-block;box-shadow:0 4px 14px rgba(225,29,72,0.4);">Log In to FaceTube</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#71717a;text-align:center;">
                Production Login Link: <br><a href="{$safeLoginLink}" target="_blank" rel="noopener noreferrer" style="color:#f43f5e;text-decoration:underline;">{$safeLoginLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#121215;padding:20px 32px;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                You can log in using either your <strong>User ID ({$safeUserId})</strong> or <strong>Registered Email</strong>.<br>
                &copy; 2026 FaceTube (facetube.online). All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
}

function sendSmtpSocketMail($config, $toEmail, $subject, $htmlBody) {
    $host = $config['host'];
    $port = (int)$config['port'];
    $user = $config['user'];
    $pass = $config['pass'];
    $from = $config['from'];

    // Extract sender email address from "Name <email@domain>"
    $fromEmail = $user;
    if (preg_match('/<([^>]+)>/', $from, $m)) {
        $fromEmail = $m[1];
    }

    $isDirectSsl = ($port === 465 || ($config['secure'] && $port !== 587));
    $socketPrefix = $isDirectSsl ? 'ssl://' : '';
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    $socket = @stream_socket_client(
        $socketPrefix . $host . ':' . $port,
        $errno,
        $errstr,
        15,
        STREAM_CLIENT_CONNECT,
        $context
    );

    if (!$socket) {
        $safeErr = $errstr ?: "code {$errno}";
        error_log("[FaceTube SMTP] Socket connection failed to {$host}:{$port} - Reason: {$safeErr}");
        return ['success' => false, 'error' => "Could not connect to SMTP server ({$host}:{$port}): {$safeErr}"];
    }

    stream_set_timeout($socket, 15);

    $readResponse = function() use ($socket) {
        $data = '';
        while (!feof($socket)) {
            $line = fgets($socket, 512);
            $data .= $line;
            if (empty($line) || substr($line, 3, 1) === ' ') {
                break;
            }
        }
        return $data;
    };

    $sendCommand = function($cmd) use ($socket, $readResponse) {
        fputs($socket, $cmd . "\r\n");
        return $readResponse();
    };

    $greeting = $readResponse();
    if (!str_starts_with($greeting, '220')) {
        fclose($socket);
        error_log("[FaceTube SMTP] Invalid greeting from {$host}: " . trim($greeting));
        return ['success' => false, 'error' => "SMTP greeting failed from {$host}"];
    }

    $ehloHost = isset($_SERVER['SERVER_NAME']) && !empty($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'facetube.online';
    $ehlo = $sendCommand('EHLO ' . $ehloHost);
    if (!str_starts_with($ehlo, '250')) {
        $ehlo = $sendCommand('HELO ' . $ehloHost);
    }

    // Support STARTTLS for port 587 or opportunistic TLS
    if (!$isDirectSsl && ($port === 587 || $port === 25)) {
        $tlsRes = $sendCommand('STARTTLS');
        if (str_starts_with($tlsRes, '220')) {
            $cryptoOk = @stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if (!$cryptoOk) {
                fclose($socket);
                error_log("[FaceTube SMTP] STARTTLS handshake failed for {$host}:{$port}");
                return ['success' => false, 'error' => "STARTTLS encryption handshake failed with {$host}:{$port}"];
            }
            $sendCommand('EHLO ' . $ehloHost);
        }
    }

    $auth = $sendCommand('AUTH LOGIN');
    if (!str_starts_with($auth, '334')) {
        fclose($socket);
        error_log("[FaceTube SMTP] AUTH LOGIN rejected by {$host}: " . trim($auth));
        return ['success' => false, 'error' => "SMTP AUTH LOGIN rejected by {$host}"];
    }

    $uRes = $sendCommand(base64_encode($user));
    if (!str_starts_with($uRes, '334')) {
        fclose($socket);
        error_log("[FaceTube SMTP] Username prompt rejected for " . maskEmailForLog($user));
        return ['success' => false, 'error' => "SMTP username rejected by {$host}"];
    }

    $pRes = $sendCommand(base64_encode($pass));
    if (!str_starts_with($pRes, '235')) {
        fclose($socket);
        error_log("[FaceTube SMTP] Authentication failed for user " . maskEmailForLog($user) . " on {$host}:{$port}");
        return ['success' => false, 'error' => "SMTP authentication failed: Incorrect credentials for {$host}"];
    }

    $fromRes = $sendCommand('MAIL FROM:<' . $fromEmail . '>');
    if (!str_starts_with($fromRes, '250')) {
        fclose($socket);
        error_log("[FaceTube SMTP] MAIL FROM rejected for <{$fromEmail}>: " . trim($fromRes));
        return ['success' => false, 'error' => "SMTP sender <{$fromEmail}> rejected by server"];
    }

    $toRes = $sendCommand('RCPT TO:<' . $toEmail . '>');
    if (!str_starts_with($toRes, '250')) {
        fclose($socket);
        error_log("[FaceTube SMTP] RCPT TO rejected for <" . maskEmailForLog($toEmail) . ">: " . trim($toRes));
        return ['success' => false, 'error' => "SMTP recipient rejected by server"];
    }

    $dataRes = $sendCommand('DATA');
    if (!str_starts_with($dataRes, '354')) {
        fclose($socket);
        error_log("[FaceTube SMTP] DATA command rejected: " . trim($dataRes));
        return ['success' => false, 'error' => "SMTP DATA command rejected"];
    }

    $headers = [];
    $headers[] = 'From: ' . $from;
    $headers[] = 'To: ' . $toEmail;
    $headers[] = 'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'Content-Transfer-Encoding: 8bit';
    $headers[] = 'Date: ' . date('r');
    $msgId = time() . '.' . md5($toEmail . microtime(true)) . '@facetube.online';
    $headers[] = 'Message-ID: <' . $msgId . '>';

    $body = implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody . "\r\n.";
    $sendRes = $sendCommand($body);

    $sendCommand('QUIT');
    fclose($socket);

    if (str_starts_with($sendRes, '250')) {
        return ['success' => true, 'messageId' => $msgId];
    }

    error_log("[FaceTube SMTP] Message delivery rejected: " . trim($sendRes));
    return ['success' => false, 'error' => "SMTP server rejected message data: " . trim($sendRes)];
}

/**
 * Public function to dispatch welcome email in PHP
 */
function sendWelcomeEmailPhp($name, $email, $userId, $loginLink = 'https://facetube.online/login') {
    $config = getSmtpConfigPhp();
    $subject = 'Welcome to FaceTube';
    $html = generateWelcomeEmailHtmlPhp($name, $email, $userId, $loginLink);

    if (!$config['configured']) {
        $missing = implode(' and ', $config['missingFields']);
        error_log("[FaceTube Email] SMTP not configured. Missing: {$missing}. Host: {$config['host']}:{$config['port']}. Recipient: " . maskEmailForLog($email));
        return [
            'success' => false,
            'provider' => 'none',
            'error' => "SMTP configuration missing: {$missing} must be configured in server environment.",
            'diagnostic' => [
                'host' => $config['host'],
                'port' => $config['port'],
                'userConfigured' => !empty($config['user']),
                'passConfigured' => !empty($config['pass'])
            ]
        ];
    }

    $smtpRes = sendSmtpSocketMail($config, $email, $subject, $html);
    if ($smtpRes['success']) {
        error_log("[FaceTube Email] Welcome email successfully sent via SMTP to: " . maskEmailForLog($email));
        return [
            'success' => true,
            'provider' => 'smtp',
            'messageId' => $smtpRes['messageId'] ?? ('smtp_' . time())
        ];
    }

    // Fallback: Hostinger PHP mail() if available on web hosting
    if (function_exists('mail')) {
        $headers = [
            'MIME-Version: 1.0',
            'Content-type: text/html; charset=UTF-8',
            'From: ' . $config['from'],
            'Reply-To: ' . $config['from'],
            'X-Mailer: FaceTube/PHP'
        ];
        $mailSent = @mail($email, '=?UTF-8?B?' . base64_encode($subject) . '?=', $html, implode("\r\n", $headers));
        if ($mailSent) {
            error_log("[FaceTube Email] Welcome email sent via PHP mail() fallback to: " . maskEmailForLog($email));
            return [
                'success' => true,
                'provider' => 'mail',
                'messageId' => 'mail_' . time()
            ];
        }
    }

    $failMsg = $smtpRes['error'] ?? 'SMTP server connection or authentication failed';
    error_log("[FaceTube Email] Email delivery failed for " . maskEmailForLog($email) . " - {$failMsg}");
    return [
        'success' => false,
        'provider' => 'smtp',
        'error' => "Email delivery failed: {$failMsg}"
    ];
}
