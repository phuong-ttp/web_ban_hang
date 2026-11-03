<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function respond(int $status, array $payload): never
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: POST');
    respond(405, ['error' => 'Phương thức không được hỗ trợ.']);
}

$apiKey = getenv('GEMINI_API_KEY');
if ($apiKey === false || trim($apiKey) === '') {
    respond(503, ['error' => 'Trợ lý AI chưa được cấu hình GEMINI_API_KEY trên máy chủ.']);
}
if (!function_exists('curl_init')) {
    respond(500, ['error' => 'Máy chủ chưa bật PHP cURL.']);
}

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput === false ? '' : $rawInput, true);
$history = is_array($input) && isset($input['messages']) && is_array($input['messages'])
    ? array_slice($input['messages'], -10)
    : [];
$products = is_array($input) && isset($input['products']) && is_array($input['products'])
    ? array_slice($input['products'], 0, 20)
    : [];
if ($history === []) {
    respond(422, ['error' => 'Vui lòng gửi nội dung tin nhắn.']);
}
if ($products === []) {
    respond(422, ['error' => 'Không nhận được danh mục sản phẩm để tư vấn. Hãy tải lại trang và thử lại.']);
}

foreach ($history as $entry) {
    if (
        !is_array($entry)
        || !isset($entry['role'], $entry['content'])
        || !in_array($entry['role'], ['user', 'assistant'], true)
        || !is_string($entry['content'])
        || trim($entry['content']) === ''
        || mb_strlen($entry['content'], 'UTF-8') > 1000
    ) {
        respond(422, ['error' => 'Lịch sử chat không hợp lệ.']);
    }
}
if ($history[count($history) - 1]['role'] !== 'user') {
    respond(422, ['error' => 'Tin nhắn cuối cùng phải là câu hỏi của bạn.']);
}

$catalog = [];
foreach ($products as $product) {
    if (
        !is_array($product)
        || !isset($product['name'], $product['description'], $product['price'])
        || !is_string($product['name'])
        || !is_string($product['description'])
        || !is_int($product['price'])
        || $product['price'] < 0
        || mb_strlen($product['name'], 'UTF-8') > 150
        || mb_strlen($product['description'], 'UTF-8') > 1000
    ) {
        respond(422, ['error' => 'Danh mục sản phẩm không hợp lệ.']);
    }
    $item = [
        'name' => $product['name'],
        'price' => $product['price'],
        'description' => $product['description'],
    ];
    if (isset($product['size']) && is_string($product['size'])) {
        $item['size'] = mb_substr($product['size'], 0, 150, 'UTF-8');
    }
    $catalog[] = $item;
}

$catalogJson = json_encode($catalog, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($catalogJson === false) {
    respond(500, ['error' => 'Không thể đọc danh mục sản phẩm.']);
}

$contents = [];
foreach ($history as $entry) {
    $contents[] = [
        'role' => $entry['role'] === 'assistant' ? 'model' : 'user',
        'parts' => [['text' => $entry['content']]],
    ];
}

$systemInstruction = 'Bạn là Trợ lý Mộng Mơ, chuyên tư vấn sản phẩm gối ngủ và sản phẩm thư giãn của cửa hàng. '
    . 'Danh mục sản phẩm có thật của website (JSON): ' . $catalogJson . "\n"
    . 'Chỉ giới thiệu sản phẩm có trong danh mục. Không tự bịa tên, giá, chất liệu, công dụng hay đặc điểm; '
    . 'chỉ nêu thông tin được ghi rõ trong danh mục. Khi giới thiệu sản phẩm, nêu đúng tên và giá bằng VND. '
    . 'Hãy hỏi khách thường nằm tư thế nào và thích gối mềm hay cứng khi chưa rõ nhu cầu. '
    . 'Tư vấn thân thiện, ngắn gọn bằng tiếng Việt. Không chẩn đoán hoặc khẳng định điều trị bệnh.';

$model = getenv('GEMINI_MODEL') ?: 'gemini-3.5-flash-lite';
$endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/'
    . rawurlencode($model) . ':generateContent';
$body = json_encode([
    'systemInstruction' => ['parts' => [['text' => $systemInstruction]]],
    'contents' => $contents,
    'generationConfig' => [
        'temperature' => 0.7,
        'maxOutputTokens' => 350,
    ],
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($body === false) {
    respond(500, ['error' => 'Không thể tạo yêu cầu tới dịch vụ AI.']);
}

$curl = curl_init($endpoint);
curl_setopt_array($curl, [
    CURLOPT_POST => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'x-goog-api-key: ' . $apiKey,
    ],
    CURLOPT_POSTFIELDS => $body,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT => 35,
]);
$responseBody = curl_exec($curl);
$curlError = curl_error($curl);
$statusCode = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
curl_close($curl);

if ($responseBody === false) {
    error_log('Mộng Mơ Gemini request failed: ' . $curlError);
    respond(502, ['error' => 'Máy chủ không kết nối được tới Gemini. Hãy kiểm tra Internet hoặc firewall.']);
}

$response = json_decode($responseBody, true);
$parts = is_array($response) ? ($response['candidates'][0]['content']['parts'] ?? []) : [];
$reply = '';
if (is_array($parts)) {
    foreach ($parts as $part) {
        if (is_array($part) && isset($part['text']) && is_string($part['text'])) {
            $reply .= $part['text'];
        }
    }
}
if ($statusCode < 200 || $statusCode >= 300 || trim($reply) === '') {
    error_log('Mộng Mơ Gemini provider returned HTTP ' . $statusCode);
    if ($statusCode === 400 || $statusCode === 404) {
        $message = 'Gemini không nhận model hoặc yêu cầu (HTTP ' . $statusCode . '). Hãy kiểm tra GEMINI_MODEL; model mặc định hiện là gemini-3.5-flash-lite.';
    } elseif ($statusCode === 401 || $statusCode === 403) {
        $message = 'Gemini từ chối API key hoặc quyền truy cập (HTTP ' . $statusCode . '). Hãy kiểm tra key và quyền trên Google AI Studio.';
    } elseif ($statusCode === 429) {
        $message = 'Gemini đang vượt giới hạn hoặc hết quota (HTTP 429). Hãy kiểm tra quota và billing của Gemini API.';
    } elseif ($statusCode >= 500) {
        $message = 'Gemini đang gặp sự cố (HTTP ' . $statusCode . '). Hãy thử lại sau.';
    } else {
        $message = 'Gemini không trả lời được (HTTP ' . $statusCode . '). Hãy kiểm tra cấu hình và thử lại.';
    }
    respond(502, ['error' => $message]);
}

respond(200, ['reply' => trim($reply)]);
