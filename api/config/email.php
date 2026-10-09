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
    $port = (int)(getenv('SMTP_PORT') ?: ($_ENV['SMTP_PORT'] ?? ($_SERVER['SMTP_PORT'] ?? 465)));
    $user = getenv('SMTP_USER') ?: ($_ENV['SMTP_USER'] ?? ($_SERVER['SMTP_USER'] ?? (getenv('GMAIL_USER') ?: ($_ENV['GMAIL_USER'] ?? ($_SERVER['GMAIL_USER'] ?? '')))));
    $pass = getenv('SMTP_PASS') ?: ($_ENV['SMTP_PASS'] ?? ($_SERVER['SMTP_PASS'] ?? (getenv('GMAIL_APP_PASSWORD') ?: ($_ENV['GMAIL_APP_PASSWORD'] ?? ($_SERVER['GMAIL_APP_PASSWORD'] ?? '')))));
    $secure = getenv('SMTP_SECURE') ?: ($_ENV['SMTP_SECURE'] ?? ($_SERVER['SMTP_SECURE'] ?? 'true'));
    $from = getenv('SMTP_FROM') ?: ($_ENV['SMTP_FROM'] ?? ($_SERVER['SMTP_FROM'] ?? ''));

    // Strip quotes and spaces from password (common with 16-char Google App Passwords)
    $pass = trim((string)$pass, " \t\n\r\0\x0B\"'");
    $pass = str_replace(' ', '', $pass);
    $user = trim((string)$user, " \t\n\r\0\x0B\"'");
    $host = trim((string)$host, " \t\n\r\0\x0B\"'");

    if (empty($host)) {
        if (!empty($user) && str_ends_with(strtolower($user), '@gmail.com')) {
            $host = 'smtp.gmail.com';
        } else {
            $host = 'smtp.hostinger.com';
        }
    }

    if (empty($from)) {
        $from = !empty($user) ? "FaceTube <{$user}>" : "FaceTube <noreply@facetube.com>";
    }

    return [
        'host' => $host,
        'port' => $port ?: 465,
        'user' => $user,
        'pass' => $pass,
        'secure' => strtolower((string)$secure) !== 'false',
        'from' => $from,
        'configured' => !empty($user) && !empty($pass)
    ];
}

function generateWelcomeEmailHtmlPhp($name, $email, $userId, $password, $loginLink) {
    $safeName = htmlspecialchars($name, ENT_QUOTES, 'UTF-8');
    $safeEmail = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
    $safeUserId = htmlspecialchars($userId, ENT_QUOTES, 'UTF-8');
    $safePassword = htmlspecialchars($password, ENT_QUOTES, 'UTF-8');
    $safeLoginLink = htmlspecialchars($loginLink, ENT_QUOTES, 'UTF-8');

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
                Your FaceTube account has been created successfully in our database.
              </p>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#27272a;border:1px solid #3f3f46;border-radius:12px;margin:20px 0 28px 0;">
                <tr>
                  <td style="padding:20px;">
                    <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#e11d48;margin-bottom:12px;">Your Account Credentials</div>
                    <table width="100%" border="0" cellspacing="0" cellpadding="6" style="font-size:14px;color:#e4e4e7;">
                      <tr><td width="35%" style="color:#a1a1aa;padding:6px 0;">User Name:</td><td style="font-weight:600;color:#ffffff;padding:6px 0;">{$safeName}</td></tr>
                      <tr><td width="35%" style="color:#a1a1aa;padding:6px 0;">User ID:</td><td style="font-family:monospace;font-weight:700;color:#f43f5e;font-size:15px;padding:6px 0;">{$safeUserId}</td></tr>
                      <tr><td width="35%" style="color:#a1a1aa;padding:6px 0;">Registered Email:</td><td style="font-weight:500;color:#ffffff;padding:6px 0;">{$safeEmail}</td></tr>
                      <tr><td width="35%" style="color:#a1a1aa;padding:6px 0;">Password:</td><td style="font-family:monospace;background:#18181b;padding:4px 8px;border-radius:6px;display:inline-block;color:#facc15;font-weight:600;">{$safePassword}</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:28px 0 20px 0;">
                <tr>
                  <td align="center">
                    <a href="{$safeLoginLink}" target="_blank" rel="noopener noreferrer" style="background-color:#e11d48;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 32px;border-radius:10px;display:inline-block;">Log In to FaceTube</a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:13px;line-height:1.6;color:#71717a;text-align:center;">
                Direct Login Link: <br><a href="{$safeLoginLink}" target="_blank" rel="noopener noreferrer" style="color:#f43f5e;text-decoration:underline;">{$safeLoginLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color:#121215;padding:20px 32px;border-top:1px solid #27272a;text-align:center;">
              <p style="margin:0;font-size:12px;color:#52525b;">
                You can log in using either your <strong>User ID ({$safeUserId})</strong> or <strong>Registered Email</strong>.<br>
                &copy; 2026 FaceTube. All rights reserved.
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
    $port = $config['port'];
    $user = $config['user'];
    $pass = $config['pass'];
    $from = $config['from'];

    // Extract sender email address from "Name <email@domain>"
    $fromEmail = $user;
    if (preg_match('/<([^>]+)>/', $from, $m)) {
        $fromEmail = $m[1];
    }

    $socketPrefix = ($port == 465 || $config['secure']) ? 'ssl://' : '';
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
        error_log("[FaceTube SMTP] Socket connection failed to {$host}:{$port} - Error: {$errstr} ({$errno})");
        return false;
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
        return false;
    }

    $ehlo = $sendCommand('EHLO ' . (isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost'));
    if (!str_starts_with($ehlo, '250')) {
        $ehlo = $sendCommand('HELO localhost');
    }

    $auth = $sendCommand('AUTH LOGIN');
    if (!str_starts_with($auth, '334')) {
        fclose($socket);
        return false;
    }

    $uRes = $sendCommand(base64_encode($user));
    if (!str_starts_with($uRes, '334')) {
        fclose($socket);
        return false;
    }

    $pRes = $sendCommand(base64_encode($pass));
    if (!str_starts_with($pRes, '235')) {
        error_log("[FaceTube SMTP] Authentication failed for user {$user} on {$host}");
        fclose($socket);
        return false;
    }

    $fromRes = $sendCommand('MAIL FROM:<' . $fromEmail . '>');
    if (!str_starts_with($fromRes, '250')) {
        fclose($socket);
        return false;
    }

    $toRes = $sendCommand('RCPT TO:<' . $toEmail . '>');
    if (!str_starts_with($toRes, '250')) {
        fclose($socket);
        return false;
    }

    $dataRes = $sendCommand('DATA');
    if (!str_starts_with($dataRes, '354')) {
        fclose($socket);
        return false;
    }

    $boundary = '=_ft_' . md5(uniqid((string)time(), true));
    $headers = [];
    $headers[] = 'From: ' . $from;
    $headers[] = 'To: ' . $toEmail;
    $headers[] = 'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=';
    $headers[] = 'MIME-Version: 1.0';
    $headers[] = 'Content-Type: text/html; charset=UTF-8';
    $headers[] = 'Content-Transfer-Encoding: 8bit';
    $headers[] = 'Date: ' . date('r');
    $headers[] = 'Message-ID: <' . time() . '.' . md5($toEmail) . '@facetube>';

    $body = implode("\r\n", $headers) . "\r\n\r\n" . $htmlBody . "\r\n.";
    $sendRes = $sendCommand($body);

    $sendCommand('QUIT');
    fclose($socket);

    return str_starts_with($sendRes, '250');
}

/**
 * Public function to dispatch welcome email in PHP
 */
function sendWelcomeEmailPhp($name, $email, $userId, $password, $loginLink) {
    $config = getSmtpConfigPhp();
    $subject = 'Welcome to FaceTube';
    $html = generateWelcomeEmailHtmlPhp($name, $email, $userId, $password, $loginLink);

    if ($config['configured']) {
        $ok = sendSmtpSocketMail($config, $email, $subject, $html);
        if ($ok) {
            error_log("[FaceTube Email] Welcome email successfully sent via SMTP to: {$email}");
            return [
                'success' => true,
                'provider' => 'smtp',
                'messageId' => 'smtp_' . time()
            ];
        }
    }

    // Fallback: Hostinger PHP mail() if available
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=UTF-8',
        'From: ' . $config['from'],
        'Reply-To: ' . $config['from'],
        'X-Mailer: FaceTube/PHP'
    ];
    $mailSent = @mail($email, '=?UTF-8?B?' . base64_encode($subject) . '?=', $html, implode("\r\n", $headers));
    if ($mailSent) {
        error_log("[FaceTube Email] Welcome email sent via PHP mail() to: {$email}");
        return [
            'success' => true,
            'provider' => 'mail',
            'messageId' => 'mail_' . time()
        ];
    }

    error_log("[FaceTube Email] Email delivery failed for {$email}. SMTP configured: " . ($config['configured'] ? 'yes' : 'no'));
    return [
        'success' => false,
        'provider' => $config['configured'] ? 'smtp' : 'none',
        'error' => 'Email delivery failed'
    ];
}
