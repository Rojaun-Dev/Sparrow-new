# WiPay Payments API Documentation

**Version:** 1.0.8  
**Date:** 23/12/2024  
**Copyright:** © 2021 by WiPay Payment Solutions Limited. All Rights Reserved.  
**Born and bred in the Caribbean.**

## Table of Contents

- [Changelog](#changelog)
- [Definitions](#definitions)
- [Format Definitions](#format-definitions)
- [Prerequisites](#prerequisites)
- [Parameter Requirements](#parameter-requirements)
- [Responses](#responses)
- [Process Flow](#process-flow)
- [Configuration](#configuration)
- [Parameters](#parameters)
- [Select Card Type Pages](#select-card-type-pages)
- [Testing - Credit/Debit Card](#testing---creditdebit-card)
- [Example Code](#example-code)
- [Transaction Response](#transaction-response)
- [Transaction Fee Rates](#transaction-fee-rates)
- [FAQs](#faqs)
- [Appendices](#appendices)

## Changelog

| Version | Description | Date |
|---------|-------------|------|
| 1.0.0 | Initial version. | 17/06/2021 |
| 1.0.1 | 1. Added the Definitions section.<br>2. Added various grammatical improvements. | 18/06/2021 |
| 1.0.2 | 1. Updated JM USD Hosted Page Service provider.<br>2. Updated name of document to be clearer. | 23/06/2021 |
| 1.0.3 | 1. Updated the formatting of various texts.<br>2. Added the Example Code section. | 29/06/2021 |
| 1.0.4 | 1. Updated upgrades to the API request parameters.<br>2. Added new OPTIONAL parameters.<br>3. Revised the Example code section.<br>4. Updated upgrades to the API's JSON response.<br>5. Updated FAC Hosted Page images. | 20/07/2021 |
| 1.0.5 | 1. Updated upgrades to the API parameters.<br>2. Revised font for parameter Formats.<br>3. Revised various wording and formatting.<br>4. Added the Select Card Type Pages section.<br>5. Updated non-AVS FAC Hosted Page image. | 10/08/2021 |
| 1.0.6 | 1. Updated information regarding changes to BB platform.<br>2. Updated the "data" request parameter to OPTIONAL.<br>3. Revised various wording and formatting. | 01/09/2021 |
| 1.0.7 | 1. Revised various wording, images and formatting.<br>2. Updated the language to indicate that both Credit and Debit cards are supported.<br>3. Added "Additional Notes" subsection to both the FAC and FGB sections.<br>4. Updated the "hash" response parameter description language. | 07/10/2021 |
| 1.0.8 | 1. Updated API Parameters<br>2. Restored missing BODY Parameter.<br>3. Revised response parameters comparison. | 23/12/2024 |

## Definitions

| Term | Definition |
|------|------------|
| **3DS** | Abbreviation for "3-D Secure". A protocol designed to be an additional security layer for online credit and debit card transactions. |
| **API** | Abbreviation for "Application Programming Interface". A type of software interface, offering a service to other pieces of software. |
| **API Key** | Refer to [What is an API Key](#what-is-an-api-key). |
| **AVS** | Abbreviation for "Address Verification Service". A service provided by major card processors to enable merchants to authenticate ownership of a credit or debit card used by a customer. |
| **CVV or CVV2** | Abbreviation for "Card Verification Value". A security feature for card not present transactions, where a personal identification number (PIN) cannot be manually entered by the cardholder. |
| **FAC** | Abbreviation for "First Atlantic Commerce". In the context of this document, it is a Hosted Page Service. |
| **FGB** | Abbreviation for "First Global Bank". In the context of this document, it is a Hosted Page Service. |
| **hash** | By definition, a "hash" is a cryptographic function which acts on a piece of data of arbitrary size, converting it into another piece of data of fixed size. In the context of this document, it is used for information security and authentication. |
| **HTTP** | Abbreviation for "Hypertext Transfer Protocol". It is a standard protocol used for transmitting and communicating data across the world wide web. |
| **HTTP Status Code** | Also known as "HTTP Response Codes", this indicates whether a specific HTTP request has been successfully completed. |
| **JSON** | Abbreviation for "JavaScript Object Notation". It is a language-independent data format for data interchange, used most commonly by web applications to communicate with a server. |
| **MD5** | Related to "hash", MD5 is a hashing algorithm (i.e. cryptographic function). |
| **parse** | Refers to the act of "parsing". It is the process of analyzing a string of symbols into its constituents to garner greater contextual or applicative value. |
| **querystring** | A query string is a part of a uniform resource locator (URL) that assigns values to specified parameters. |
| **sandbox** | In the context of this document, "sandbox" can be considered synonymous to "test" or "testing environment". |
| **Web-redirects** | Also known as "HTTP redirection", it is a technique to give more than one URL address to a page, a form, or a whole Web site/application. |

## Format Definitions

The parameters passed to the API are all validated against a specific format. This section describes what the format descriptions mean for any given parameter as defined in this document.

| Format | Description |
|--------|-------------|
| **a** | **Alphabetic.** <ul><li>a-z (lowercase)</li><li>A-Z (uppercase)</li><li>" " (space)</li></ul> Characters with accents are **not** supported. The " " is acceptable only in certain parameters. |
| **b** | **Boolean.** <ul><li>**true**: true, 1, "true", "1"</li><li>**false**: false, 0, "false", "0"</li></ul> Booleans will always have a length of 1 (implied). |
| **d** | **Dashes.** <ul><li>"-"</li><li>"_"</li></ul> |
| **n** | **Numeric.** <ul><li>0-9</li><li>"." (acceptable only in certain parameters)</li></ul> |
| **s** | **Special.** <ul><li>!#$%&"'*{}+,/:;<>=?@[\]^`(\|)~</li></ul> A subset of these characters are acceptable under certain circumstances for certain parameters. |
| **v** | **Variable.** This means that any character is permissible, and/or any length is permissible. |
| **[]** | **Length, or Size.** <ul><li>**[NUM]** - The given parameter may only have NUM length.</li><li>**[MIN-MAX]** - The given parameter may have any length from MIN (inclusive) to MAX (inclusive).</li><li>**[NUM1\|NUM2]** - The given parameter may have either NUM1 length only, or NUM2 length only.</li></ul> |

These formats (except Boolean, Variable and Length) may be uniquely chained together to form a compound format specification. For example, "a[v]" is defined as any alphabetic data with variable length. However, it can be compounded as "an[v]", which would now be defined as alpha-numeric data with variable length.

### Examples

| Format | Description |
|--------|-------------|
| **an[5]** | Alphabetic + Numeric. Commonly referred to as "alphanumeric". Which results in a-z, A-Z, 0-9 and "." as valid characters. The "[5]" indicates that this "alphanumeric" data can only be 5 characters long. |
| **v[2-10]** | Variable data that can have a minimum of 2 characters, or a maximum of 10 characters. |
| **ans[5\|10-15]** | Alphabetic + Numeric + Special. Valid characters are a-z, A-Z, 0-9,"." and any of "!#$%&"'*{}+,/:;<>=?@[\]^`(\|)~". The data can have a length of 5, or a minimum length of 10 to a maximum length of 15. |

## WiPay Plugins Payment Request

The official WiPay API endpoint for requesting a Transaction Gateway (Secure Hosted Page).

### Prerequisites

To use this API for LIVE transactions:

1. You must have a WiPay Business Account.
2. Your WiPay Business Account must be Verified.
3. You must have an API Key.

There are no other special requirements for using the API for SANDBOX transactions (testing). However, do note that the API Key for the Test WiPay Account is **123**.

### Parameter Requirements

| Requirement | Description |
|-------------|-------------|
| **REQUIRED** | The parameter must be submitted with the API request. Failure to do so will result in an error response; usually 400-class responses. |
| **OPTIONAL** | The parameter may be submitted with the API request. Failure to do so will not result in an error response. |

## Responses

### Web-redirect

If the API is configured for Web-redirects, then:

- For **Success** responses, users will be automatically redirected to the Payment Gateway Secure Hosted Page.
- For **Error** responses, users will be automatically redirected to the Response URL (the `response_url` parameter) with the appropriate response parameters appended in the Response URL as a querystring.

### JSON

The following JSON is returned, if the API is configured for JSON-responses. Please note that the `transaction_id` may not always be present. The API will always attempt to return the `transaction_id` where possible.

#### Success responses
HTTP status code 200-class or 300-class responses will be given for successful API requests.

```json
{
 "url":"<_UNIQUE_HOSTED_PAGE_PAYMENT_URL_>",
 "message":"<_HTTP_STATUS_MESSAGE_>",
 "transaction_id": "<_TRANSACTION_ID_>"
}
```

#### Error responses
HTTP status code 400-class or 500-class responses will be given for unsuccessful API requests.

```json
{
 "url":"<_RETURN_URL_WITH_ERROR_IN_QUERY_STRING_PARAMETERS_>",
 "message":"<_ERROR_MESSAGE_DESCRIPTION_>",
 "transaction_id": "<_TRANSACTION_ID_>"
}
```

## Process Flow

When using this API, the general high-level flow for every transaction is:

1. WiPay Merchant's web-based application uses this API to obtain a Hosted Page URL.
2. WiPay Merchant's web-based application uses the received Hosted Page URL to redirect the Customer to the Hosted Page.
3. Customer makes payment using the Hosted Page by submitting their payment credentials.
4. Hosted Page web-redirects to this API's configured `response_url` with the result of the transaction appended as a query string, containing the response parameters.

The transaction process will always communicate between these entities:

1. The Customer's web-browser (Payor)
2. The WiPay Merchant's website (Payee)
3. WiPay's platform (WiPay)
4. Hosted Page Service
5. 3DS Authentication Service

## Configuration

We strongly recommend that you use the API URL that is most relevant to the country where your WiPay Account is Verified. While these API URLs can function normally across different countries, sending the API request to the native country of the WiPay Account would result in faster responses.

| API URL | HTTP Method |
|---------|-------------|
| https://bb.wipayfinancial.com/plugins/payments/request | POST |
| https://gy.wipayfinancial.com/plugins/payments/request | POST |
| https://jm.wipayfinancial.com/plugins/payments/request | POST |
| https://tt.wipayfinancial.com/plugins/payments/request | POST |

## Parameters

### HEADERS

#### Accept (OPTIONAL)
- **Example:** `application/json`
- **Description:** You may explicitly set this request-header field to request either a JSON response, or a web-redirect response from our API.
- **Format:** `as[v]`
- **Options:** `application/json`, `*/*`
- **Notes:**
  1. Use `application/json` to get a JSON response.
  2. Use `*/*`, or omit this request-header field, to get a web-redirect response.

#### Content-Type (OPTIONAL)
- **Example:** `application/x-www-form-urlencoded`
- **Description:** This request-header field must be set so that the parameters defined in request-body can be interpreted.
- **Format:** `as[v]`

### BODY

#### account_number (REQUIRED)
- **Example:** `1234567890`
- **Description:** Your LIVE WiPay Account Number.
- **Format:** `n[10]`
- **Notes:**
  1. If environment is sandbox, then you must use the WiPay SANDBOX Account Number `1234567890`.

#### avs (OPTIONAL)
- **Example:** `0`
- **Description:** This enables AVS on the payment gateway. This also enables the AVS-only parameters that can be sent to pre-fill the fields on the AVS form.
- **Format:** `b`
- **Options:** `0`, `1`
- **Notes:**
  1. AVS-only parameters are meant to be filled out by the Payor.
  2. AVS-only parameters' information are meant to be consistent with the KYC submitted to the Payor card's issuing Bank.

#### card_type (OPTIONAL)
- **Example:** `mastercard`
- **Description:** The payment processing network of the Payor's card.
- **Format:** `a[v]`
- **Options:** `mastercard`, `visa`
- **Notes:**
  1. If this parameter is not provided in the API request, Payors will first encounter a Select Card Type page before entering their Card information.

#### country_code (REQUIRED)
- **Example:** `TT`
- **Description:** The country in which your `account_number` is registered.
- **Format:** `a[2]` ISO 3166-1 alpha-2
- **Options:** `BB`, `JM`, `TT`

#### currency (REQUIRED)
- **Example:** `TTD`
- **Description:** The currency of the total for this transaction.
- **Format:** `a[3]` ISO 4217 alpha code
- **Options:** `JMD`, `TTD`, `USD`
- **Notes:**
  1. This depends on `country_code`, since supported currencies vary based on the country.

#### environment (REQUIRED)
- **Example:** `sandbox`
- **Description:** Determines if the payment gateway will be configured to the test environment, or not.
- **Format:** `a[v]`
- **Options:** `live`, `sandbox`

#### fee_structure (REQUIRED)
- **Example:** `customer_pay`
- **Description:** Controls how and who pays the WiPay Transaction Fee.
- **Format:** `ad[v]`
- **Options:** `customer_pay`, `merchant_absorb`, `split`
- **Notes:**
  1. This directly affects the final total of the transaction.

#### method (REQUIRED)
- **Example:** `credit_card`
- **Description:** Determines the payment method your customers will use to pay you.
- **Format:** `ad[v]`
- **Options:** `credit_card`
- **Notes:**
  1. This parameter depends on `country_code` and `currency`.
     a. For example, voucher is available for `country_code` of TT and `currency` of TTD only (voucher option coming soon).
  2. The `credit_card` option supports both Credit and Debit cards; this support is primarily determined by the card's Issuing Bank.

#### order_id (REQUIRED)
- **Example:** `oid_123-aBc`
- **Description:** Your application's custom unique identifier for this transaction.
- **Format:** `ad[1-16|1-48]`
- **Notes:**
  1. Must begin and end with an alphanumeric character.
  2. Up to 48 characters for FAC.
  3. Up to 16 characters for FGB.
  4. This parameter depends on `country_code` and `currency`.
  5. This parameter should always be unique.

#### origin (REQUIRED)
- **Example:** `WiPay-example_app`
- **Description:** Your application's custom unique identifier for this transaction.
- **Format:** `ad[1-32]`
- **Notes:**
  1. Must begin and end with an alphanumeric character.

#### response_url (REQUIRED)
- **Example:** `https://tt.wipayfinancial.com/response/`
- **Description:** Your application's designated URL to handle WiPay's transaction response.
- **Format:** `as[1-255]` Generic URI syntax
- **Notes:**
  1. This parameter will be appended with a querystring of response parameters.

#### total (REQUIRED)
- **Example:** `10.00`
- **Description:** The price of your product or service.
- **Format:** `n`
- **Notes:**
  1. This value must be correct to 2 decimal places.
  2. Based on the configured `fee_structure` for the payment request, payors may see a final total affected by your WiPay account's transaction rates. Please see the Transaction Fee Rates section for further details.
  3. The minimum value for this parameter is $1.00 USD or the currency-value equivalent.

#### version (OPTIONAL)
- **Example:** `1.0.0`
- **Description:** Your application's official version number.
- **Format:** `ans[1-16]` Semantic Versioning (recommended)

#### addr1 (OPTIONAL)
- **Example:** `-`
- **Description:** The Street Address of the Payor's residence
- **Format:** `adn[1-50]`
- **Notes:**
  1. AVS-only pre-fill is supported.

#### addr2 (OPTIONAL)
- **Example:** `-`
- **Description:** The Apartment, Suite, Floor etc. of the Payor.
- **Format:** `adn[0-50]`
- **Notes:**
  1. AVS-only pre-fill is supported.
  2. This parameter can be empty.

#### city (OPTIONAL)
- **Example:** `-`
- **Description:** The city of residence of the Payor.
- **Format:** `a[1-30]`
- **Notes:**
  1. AVS-only pre-fill is supported.

#### country (OPTIONAL)
- **Example:** `-`
- **Description:** The country in which the Payor legally resides.
- **Format:** `a[2]` ISO 3166-1 Alpha 2
- **Notes:**
  1. AVS-only pre-fill is supported.

#### email (OPTIONAL)
- **Example:** `-`
- **Description:** The Payor's contact email.
- **Format:** `ans[1-50]` RFC 822
- **Notes:**
  1. AVS-only pre-fill is supported.
  2. This will enable the Payor to receive an automated email upon Transaction submission (both success and fail).
  3. If present, this parameter is appended to the response parameters as `customer_email`.

#### fname (OPTIONAL)
- **Example:** `-`
- **Description:** The Payor's legally registered first name.
- **Format:** `adn[1-30]`
- **Notes:**
  1. AVS-only pre-fill is supported.
  2. Both `fname` and `lname` parameters are concatenated and appended to the response parameters as `customer_name` for AVS transactions.

#### lname (OPTIONAL)
- **Example:** `-`
- **Description:** The Payor's legally registered last name.
- **Format:** `adn[0-30]`
- **Notes:**
  1. AVS-only pre-fill is supported.
  2. This parameter can be empty.
  3. If provided, this parameter must be used together with `fname`.

#### name (OPTIONAL)
- **Example:** `-`
- **Description:** The Payor's legally registered full name.
- **Format:** `adn[1-60]`
- **Notes:**
  1. AVS-only pre-fill is supported.
     a. For AVS transactions, if this parameter is provided and `fname` and `lname` were not provided, then this parameter will always attempt to split into an `fname` and `lname` pair.
     b. The `lname` will always be parsed as the last word.
  2. If present, this parameter is appended to the response parameters as `customer_name` for non-AVS transactions.

#### phone (OPTIONAL)
- **Example:** `-`
- **Description:** The Payor's contact phone number.
- **Format:** `ns[1-20]` E.164 (recommended)
- **Notes:**
  1. AVS-only pre-fill is supported.
     a. This parameter is validated using Google's libphonenumber library.
  2. If present, this parameter is appended to the response parameters as `customer_phone` for non-AVS transactions.

#### state (OPTIONAL)
- **Example:** `-`
- **Description:** The US state in which the Payor resides.
- **Format:** `a[2]` ISO 3166-2:US (second part)
- **Notes:**
  1. AVS-only pre-fill is supported.
  2. This applies only to US-based residency; i.e. if country is US.

#### zipcode (OPTIONAL)
- **Example:** `-`
- **Description:** The Zip/Postal Code of the Payor.
- **Format:** `an[1-10]`
- **Notes:**
  1. AVS-only pre-fill is supported.

## Select Card Type Pages

The Select Card Type page is where Payors select the payment processing network of their Card. Payors may see this page before entering their card information.

This is a mandatory step in the payment process. Payors will only see this page if the `card_type` parameter is not present in the original API request.

### FAC
[Image shows WiPay interface with Total Due: $17.15 TTD and card type selection between VISA and Mastercard options]

### FGB
[Image shows First Global Bank interface with Amount $ 17.15 JMD and payment method selection dropdown]

## Testing - Credit/Debit Card

WiPay considers testing to be the single most important aspect of any integration. It is to ensure that your web-based application behaves consistently and predictably when it uses our external service (API).

Generally, this API behaves consistently for both LIVE and SANDBOX transactions - barring any specific response parameter differences as would be expected for unique transaction attempts.

**Please note:**
- When conducting test transactions (SANDBOX i.e. environment is set to `sandbox`), all reporting features are disabled;
  - Payees and Payors do not receive automated emails.
  - Transaction History information will not be available.

### Test Cards

You may use these cards to test for different types of responses from the FAC Hosted Page.

**Please note that:**
- Any expiry date and any 3 digit CVV2 value will work for these test cards.
- All card numbers not listed above are defaulted to Normal Approval.
- "Normal Approval" means ResponseCode=1, ReasonCode=1.
- "Normal Decline" means ResponseCode=2, ReasonCode=2

#### Mastercard Test Cards

| Card Number | Result |
|-------------|--------|
| 5111111111111111 | Normal Approval, CVV2Result=M |
| 5111111111112222 | Normal Approval, CVV2Result=N |
| 5333333333332222 | Normal Approval, CVV2Result=U |
| 5444444444442222 | Normal Approval, CVV2Result=P |
| 5555555555552222 | Normal Approval, CVV2Result=S |
| 5555666666662222 | Normal Decline, OriginalResponseCode=05, CVV2Result=N |
| 5111111111113333 | Normal Decline, OriginalResponseCode=05 |
| 5111111111114444 | Normal Approval, AVSResult=Y |
| 5111111111115555 | Normal Approval, AVSResult=A |
| 5111111111116666 | Normal Approval, CVV2Result=M, AVSResult=Z |
| 5111111111117777 | Normal Approval, CVV2Result=M, AVSResult=N |
| 5111111111118888 | Normal Approval, CVV2Result=N, AVSResult=U |
| 5111111111119999 | Normal Decline, OriginalResponseCode=98 |
| 5111111111110000 | Normal Decline, OriginalResponseCode=91 |
| 5222222222222222 | Normal Approval, CVV2Result=N, AVSResult=U |

#### VISA Test Cards

| Card Number | Result |
|-------------|--------|
| 4111111111111111 | Normal Approval, CVV2Result=M |
| 4111111111112222 | Normal Approval, CVV2Result=N |
| 4333333333332222 | Normal Approval, CVV2Result=U |
| 4444444444442222 | Normal Approval, CVV2Result=P |
| 4555555555552222 | Normal Approval, CVV2Result=S |
| 4666666666662222 | Normal Decline, OriginalResponseCode=05, CVV2Result=N |
| 4111111111113333 | Normal Decline, OriginalResponseCode=05 |
| 4111111111114444 | Normal Approval, AVSResult=M |
| 4111111111115555 | Normal Approval, AVSResult=A |
| 4111111111116666 | Normal Approval, AVSResult=Z |
| 4111111111117777 | Normal Approval, AVSResult=N |
| 4111111111118888 | Normal Approval, AVSResult=G |
| 4111111111119999 | Normal Decline, OriginalResponseCode=98 |
| 4111111111110000 | Normal Decline, OriginalResponseCode=91 |
| 4222222222222222 | Normal Approval, CVV2Result=M, AVSResult=N |

### Additional Notes (FAC)

1. The Payor's Card may be debited in TTD despite the API configuration; for example, if the API request was set to currency as USD. This would occur if your Card was issued locally in Trinidad and Tobago. In these cases, the Payee is also credited the transactional value equivalent in TTD.
2. The Payor's Card may be debited in USD despite the API configuration; for example, if the API request was set to currency as TTD. This would occur if your Card was NOT issued locally in Trinidad and Tobago. In these cases, the Payee is also credited the transactional value equivalent in USD.
3. In the above cases, WiPay uses a static conversion rate of USD to TTD of 6.80.

### FGB Testing

#### Non-AVS Hosted Page
[Image shows First Global Bank hosted payment page with card details form]

#### AVS Hosted Page
Coming soon.

#### Test Cards

You may use these cards to test for different types of responses from the FGB Hosted Page.

**Please note that:**
- Any value for "Cardholder Name" on the Hosted Page may be used (may even remain empty).
- Any 2-digit "Expiration Month", "Expiration Year", and 3-digit "Card Code" will work for these test cards.
- The provided cards guarantee an APPROVED (success) response.
- Any other cards will result in a FAILED or DECLINED (fail) response.

| Card Type | Card Number | Result |
|-----------|-------------|--------|
| **Mastercard** | 5210000010001001 | 3DS, 3DSResCode=1, AuthStatus=Y |
| **Mastercard** | 5204740000002711 | FF3DS2+3DSM, 3DSResCode=1, AuthStatus=Y |
| **VISA** | 4035874000424977 | 3DS, 3DSResCode=1, AuthStatus=Y |
| **VISA** | 4265880000000007 | FF3DS2+3DSM, 3DSResCode=1, AuthStatus=Y |

**Additional Notes:**
- When using a provided card, if prompted for password authentication, please use the same text given for the "Personal Message" (see Appendix 1 - 3DS Authentication Password dialog).
- The FGB Hosted Page will always show the Payor an intermediary transaction result summary page before redirecting away.
- Redirecting away from the FGB Hosted Page occurs only when the Payor clicks the "Return to Shop" button at the transaction result summary page.

## Example Code

To serve as a quick starting point, this section provides working example implementations of the WiPay Plugins Payment Request API using the minimum set of parameters.

You may use any modern, popular Web API-capable library of your choice. The recommendations given in this section are based on our users' feedback, which we know have been tried, tested and proven working.

**We do not recommend using the provided example code as-is for production environments.**

### HTML

The Old API was popularly implemented as an HTML form. This approach is also possible with the New API. Upon clicking the "Checkout" button, this will always automatically redirect the Payor to the Hosted Page (no JSON response).

```html
<form action="https://tt.wipayfinancial.com/plugins/payments/request"
method="POST">
 <input type="hidden" name="account_number" value="1234567890">
 <input type="hidden" name="avs" value="0">
 <input type="hidden" name="country_code" value="TT">
 <input type="hidden" name="currency" value="TTD">
 <input type="hidden" name="data" value="{&quot;a&quot;:&quot;b&quot;}">
 <input type="hidden" name="environment" value="sandbox">
 <input type="hidden" name="fee_structure" value="customer_pay">
 <input type="hidden" name="method" value="credit_card">
 <input type="hidden" name="order_id" value="oid_123-aBc">
 <input type="hidden" name="origin" value="WiPay-example_app">
 <input type="hidden" name="response_url"
value="https://tt.wipayfinancial.com/response/">
 <input type="hidden" name="total" value="10.00">
 <!-- Redirect occurs after clicking Checkout -->
 <input type="submit" value="Checkout">
</form>
```

### PHP

We recommend using PHP's cURL library. This is used for implementing the API on the server-side.

```php
$curl = 
curl_init('https://tt.wipayfinancial.com/plugins/payments/request');
curl_setopt_array($curl, [
 CURLOPT_FOLLOWLOCATION => false,
 CURLOPT_HEADER => false,
 CURLOPT_HTTPHEADER => [
 'Accept: application/json',
 'Content-Type: application/x-www-form-urlencoded'
 ],
 CURLOPT_POST => true,
 CURLOPT_POSTFIELDS => http_build_query([
 'account_number' => '1234567890',
 'avs' => '0',
 'country_code' => 'TT',
 'currency' => 'TTD',
 'data' => '{"a":"b"}',
 'environment' => 'sandbox',
 'fee_structure' => 'customer_pay',
 'method' => 'credit_card',
 'order_id' => 'oid_123-aBc',
 'origin' => 'WiPay-example_app',
 'response_url' => 'https://tt.wipayfinancial.com/response/',
 'total' => '10.00'
 ]),
 CURLOPT_RETURNTRANSFER => true
]);
$result = curl_exec($curl);
curl_close($curl);
# result in JSON format (header)
$result = json_decode($result);
# perform redirect
header("Location: {$result->url}");
die();
```

### JavaScript

We recommend using jQuery's `$.ajax()` where possible, however modern vanilla Javascript is more than capable. This is used for implementing the API on the client-side.

```javascript
var headers = new Headers();
headers.append('Accept', 'application/json');

var parameters = new URLSearchParams();
parameters.append('account_number', '1234567890');
parameters.append('avs', '0');
parameters.append('country_code', 'TT');
parameters.append('currency', 'TTD');
parameters.append('data', '{"a":"b"}');
parameters.append('environment', 'sandbox');
parameters.append('fee_structure', 'customer_pay');
parameters.append('method', 'credit_card');
parameters.append('order_id', 'oid_123-aBc');
parameters.append('origin', 'WiPay-example_app');
parameters.append('response_url', 
'https://tt.wipayfinancial.com/response/');
parameters.append('total', '10.00');

var options = {
 method: 'POST',
 headers: headers,
 body: parameters,
 redirect: 'follow'
};

fetch('https://tt.wipayfinancial.com/plugins/payments/request', options)
 .then(response => response.text())
 .then(result => {
 // result in JSON format (header)
 result = JSON.parse(result);
 // perform redirect
 window.location.href = result.url;
 })
 .catch(error => console.log('error', error));
```

## Transaction Response

Transaction responses always occur as a web-redirect from the Hosted Payment Page to the `response_url` submitted in the original API request to the WiPay Plugins Payment Request API.

After the payor enters their payment credentials and/or information, a web-redirect occurs to the `response_url`. This is a GET request to the `response_url`. The `response_url` is appended with a URL-encoded querystring containing the result and data of the Transaction that just occurred - commonly referred to as the "response parameters."

When implementing this API, it is intended that the result of the Transaction is parsed from the querystring in the `response_url`. Thus, we strongly recommend that the `response_url` is a dedicated endpoint on your web-based application's domain. This will allow you to implement your own custom logic to parse the response parameters and handle the rest of your application's logic concerning the transaction in one place.

### Response Parameters

The following table defines all the possible response parameters. For some response parameters, their specific formats may vary between Hosted Page Services (FAC/FGB). Additionally, some response parameters may be conditionally absent.

#### card
The padded card number used by the Payor for the Transaction. Only the last FOUR (4) digits of the Payor's card will be exposed.

**FAC (example):** `XXXXXXXXXXXX1111`  
**FGB (example):** `(VISA) ... 0026`

#### currency
The currency of the Transaction's total.

This will always be the same as the currency request parameter sent in the original API request.

#### customer_address *(conditionally absent)*
The full legally registered address of the Payor (Card Holder).

This parameter is always composed in the following format:
`addr1, addr2, city, state zipcode, country`

Each of these component strings may be pre-filled in the AVS-enabled API request, or, will be defined when the Payor completes an AVS-enabled Transaction.

#### customer_company *(conditionally absent)*
The legally registered name of the Payor's (Card Holder's) company.

This parameter is application specific; it is supported only by select origins.

Please Contact Us to coordinate for supporting this parameter in your application.

#### customer_email *(conditionally absent)*
The contact email for the Payor (Card Holder).

This parameter may be pre-filled in the AVS-enabled API request, or, will be defined when the Payor completes an AVS-enabled Transaction.

If present in the original request, this parameter may be defined by: `email`

#### customer_name *(conditionally absent)*
The legally registered name of the Payor (Card Holder).

For AVS transactions, this parameter will is always composed in the following format:
`fname lname`

These component strings may be pre-filled in the AVS-enabled API request, or, will be defined when the Payor completes an AVS-enabled Transaction.

For non-AVS transactions, this parameter may be defined by: `name`

#### customer_phone *(conditionally absent)*
The contact phone number for the Payor (Card Holder). Please note that for AVS transactions, this parameter will always be in E.164 format.

This parameter may be pre-filled in the AVS-enabled API request, or, will be defined when the Payor completes an AVS-enabled Transaction.

If present in the original request, this parameter may be defined by: `phone`

#### data
The original data submitted in the origin API request.

**NOTE:** This parameter would have been subject to change. WiPay's security modules may have either altered or omitted this parameter in the response.

#### date
An RFC 3339-compliant date and time.

This parameter will always have the following format:
`YYYY-MM-DD hh:mm:ss`

Where:
- **YYYY** 4-digit Year
- **MM** 2-digit Month
- **DD** 2-digit Day
- **hh** 2-digit Hour (24-hour)
- **mm** 2-digit Minute
- **ss** 2-digit Second

#### hash *(conditionally absent)*
A verification check for the response of the Transaction.

This hash is calculated using the md5 algorithm on a concatenated string consisting of (in order):
1. the transaction_id
2. the original total
3. the WiPay account's API Key

There are no separators between the strings being concatenated.

**NOTE:** this parameter is returned for status as success Transactions only.

#### message
The summary of the Transaction. This parameter is used as the main message and can often offer high-level insight as to what had transpired for any given Transaction.

The general format of this parameter will always be:
`[<A>-R<B>]: <C>.`

**FAC:**
- **<A>** Response Code:
  - "1" - Approved
  - "2" - Declined
  - "3" - Error
- **<B>** Reason Code: any number between 1 and 9999 (inclusive)
- **<C>** Reason Description: a short description of the Transaction mainly using the Reason Code Description

**FGB:**
- **<A>** Approval Code:
  - "Y" - Approved
  - "N" - Failed/Error
- **<B>** Processor Response Code: any number between 0 and 9999 (inclusive). "00" to "09" (inclusive) is also possible.
- **<C>** Reason Description: a short description of the Transaction that combines the Approval Code message and the Fail Reason (if it exists).

#### order_id
The order_id submitted in the original API request.

There is no change to this parameter between the request and the response.

#### status
The result of the Transaction, describing whether it was a success, failed or error.

For every completed Transaction, this parameter will always be one of:
- `success`
- `failed`
- `error`

It is intended that this parameter is to be used together with the message response parameter as the main messaging for the Payor response.

#### total
The Transaction's final total, i.e. the amount the Payor was debited for.

Recall: the final total is primarily affected by `fee_structure`, where;
- Under `customer_pay`, the full Transaction Fee is added to the original total.
- Under `split`, half of the Transaction Fee is added to the original total.
- Under `merchant_absorb`, the original total and final total are the same (no added Transaction Fee).

This final total is also affected by `country_code`, as described in the Transaction Fee Rates section.

#### transaction_id
The WiPay Transaction ID for the Transaction.

This parameter is very important because WiPay uses this Transaction ID for most of its internal operations after the Payee-Payor Transactional process.

This parameter will always consist of the following strings concatenated by a dash ("-") character;
1. **SB** prefix (for environment as sandbox Transactions only, not present otherwise)
2. A random number between 1 and 99
3. The Payee's WiPay-internal User ID number
4. The order_id submitted in the original API request
5. A 24-hour datetime string in the following format: `YYYYMMDDhhmmss`

### Example

In these examples, we provide the parsed response parameters your web-based application can expect to receive in the querystring of your API request's configured `response_url`.

#### FAC

Non-AVS response parameters would exclude the AVS-only fields. No other differences exist.

In this example, the WiPay Payments Request API request was configured for the TT platform, for a total of 10.00 USD where the customer_pays the Transaction Fees, and AVS set to enabled. On the AVS FAC Hosted Page, all the provided information by the Payor was true and valid, resulting in a successful Transaction.

| Parameter | Value |
|-----------|-------|
| card | XXXXXXXXXXXX1111 |
| currency | USD |
| customer_address | #66 Crossbay Court, Westmoorings, Port Of Spain, Trinidad and Tobago |
| customer_email | john.doe@example.com |
| customer_name | John Doe |
| customer_phone | 12462223333 |
| data | "test" |
| date | 2021-06-16 02:41:52 |
| hash | 3d34d20260f7433ceee277e9ed9166a3 |
| message | [1-R1]: Transaction is approved. |
| order_id | oid_123-aBc |
| status | success |
| total | 12.05 |
| transaction_id | SB-12-1-oid_123-aBc-20210616024001 |

#### FGB

The AVS response parameters do not currently exist for this Hosted Page Service.

In this example, the WiPay Payments Request API request was configured for the JM platform, for a total of 10.00 JMD where the merchant_absorbs the Transaction Fees. On the FGB Hosted Page, an invalid CVV was provided by the Payor for a VISA Credit/Debit Card ending in 0026, resulting in a failed Transaction.

| Parameter | Value |
|-----------|-------|
| card | (VISA) ... 0026 |
| currency | JMD |
| customer_name | John Doe |
| data | "test" |
| date | 2021-06-16 15:58:54 |
| message | [N-R5101]: 3D Secure authentication failed. Wrong password entered, authentication failed. |
| order_id | oid_123-aBc |
| status | failed |
| total | 10.00 |
| transaction_id | SB-84-1-oid_123-aBc-20210616032823 |

## Transaction Fee Rates

| Country | Plan | Payment Method | Rate |
|---------|------|----------------|------|
| **BB** | BASIC FREE | Credit/Debit Card | 3.80% + Tax³⁴ |
| **GY** | NA | Credit/Debit Card | 4.20% + GCT³⁴ |
| **JM** | BASIC FREE | Credit/Debit Card | 4.20% + GCT³⁴ |
| **JM** | Any paid Plan¹ | Credit/Debit Card | 3.80% + GCT³⁴ |
| **TT** | BASIC FREE | Credit/Debit Card | 3.50% + $0.25 USD³ |
| **TT** | Any paid Plan¹ | Credit/Debit Card | 3.00% + $0.25 USD³ |

**Notes:**

1. **Paid WiPay Plans** are monthly (30-day) subscriptions on the WiPay platform that offer certain platform-wide benefits to subscribers.
   - Paid Plans are (but not limited to);
   - **BUSINESS:** Business Plus, Business Premium
   - **PERSONAL:** Personal Premium

2. **Vouchers** available only in supported platforms; TT.

3. **Dollar-value fees** are relative to the currency of the Transaction and are always converted to the currency-equivalent value for that Transaction.

4. **GCT or Tax** refers to "General Consumption Tax" and is applied platform-wide for the BB and JM platforms. It's dollar-value is calculated as a standard 15% of the total percentage Transactional fee.

## FAQs

### What is the difference between the new and old APIs?

Here, we will compare the Old API and the New API side-by-side. This section will highlight the shortcomings of the Old API and hence show the need for a New API.

| Feature | Old API | New API |
|---------|---------|---------|
| **Accountable by request Origin** | No | Yes |
| **AVS capable** | No | Yes |
| **Fee Structure supported** | No | Yes |
| **JSON response capable** | No | Yes |
| **No. countries supported** | 1 | All; BB, GY, JM and TT |
| **No. currencies supported** | 1 | All; JMD, TTD and USD |
| **No. of environments supported** | 1 | All; live and sandbox |
| **Payment method support** | 1 | All; Credit Card, Voucher¹ |
| **Transaction ID assignment** | At response | At request |
| **Transaction recovery turnover** | Up to 1 hour | 5 minutes or less |
| **Other** | - | 1. Enhanced parameter validation (including improved anti-XSS measures)<br>2. Enhanced error handling and reporting.<br>3. Enhanced fraud protection measures.<br>4. Enhanced WiPay Account validation. |

¹ Voucher support coming soon for supported platforms.

#### Request Parameters

| Old API | New API (best equivalent) |
|---------|---------------------------|
| - | addr1 |
| - | addr2 |
| - | avs |
| - | city |
| - | country |
| - | country_code |
| - | currency |
| data | data |
| developer_id | account_number |
| email | email |
| - | environment |
| - | fee_structure |
| - | method |
| name | fname, lname |
| order_id | order_id |
| - | origin |
| phone | phone |
| return_url | response_url |
| - | state |
| total | total |
| - | zipcode |

#### Response Parameters

| Old API | New API (best equivalent) |
|---------|---------------------------|
| - | card |
| - | currency |
| - | customer_address |
| - | customer_company |
| D | - |
| data | data |
| date | date |
| email | customer_email |
| hash | hash |
| name | customer_name |
| order_id | order_id |
| phone | customer_phone |
| reasonCode | message |
| reasonDescription | message |
| responseCode | message |
| status | status |
| total | total |
| transaction_id | transaction_id |

### How to get the money into my Bank Account?

Once you are logged into your WiPay Business Account, navigate to your WiPay Account Dashboard. Go to "Account" > "Withdraw" on the left navigation bar.

When you click on "Withdraw", you will then see this interface:

[Screenshot shows WiPay withdrawal interface with currency selection dropdown and amount field]

Follow the instructions on-screen and your Withdrawal request will be made!

**Please note:**
- All Withdrawals are subject to a flat Withdrawal fee defined by currency and country.
- Withdrawals may take **up to SEVEN (7) working days** to settle into your Bank Account.
- Your WiPay Account must be Verified.
- Your banking information must be accurately and completely entered on your WiPay Account.

### What is an API Key?

An API Key is a unique alphanumeric string generated by WiPay for your Business Account. The Key acts as a Private Key or "secret component" for the Transaction hashing algorithm. You must use your unique API Key to re-calculate the MD5 hash signature of the Transactions. Transactions are considered authenticated only when the re-calculated MD5 hash signature exactly matches that of the Transaction.

Please do **not** share your API Key. If your API Key has ever been publicly exposed or otherwise compromised, you should re-generate your API Key as soon as possible.

### How to get my API Key?

Once you are logged into your WiPay Business Account, navigate to your WiPay Account Dashboard. Go to the "Developer" section of your Profile by clicking on your Account's profile picture at the top-right corner of the screen.

**NOTE:** If you do not see the "Developer" option in the dropdown menu, please ensure that your WiPay Business Account has been Verified.

When you click on "Developer", you will then see this interface:

[Screenshot shows access denied message requiring website URL entry]

Please follow the instructions on screen, and enter the Website URL from which you will be sending your API requests to WiPay. Click "Submit" once done.

Your page will then refresh and you will now see this interface:

[Screenshot shows API Key interface displaying "6bw2lj079aau" as example]

Here, we see that the API Key for this example Account is "6bw2lj079aau".

### How do I generate a new API Key?

Generating a new API Key will permanently unlink your old (current) API Key from your WiPay Business Account. This is especially useful if your existing API Key was compromised in any way.

Once you are logged into your WiPay Business Account, navigate to your WiPay Account Dashboard. Go to the "Developer" section of your Profile by clicking on your Account's profile picture at the top-right corner of the screen.

If you already have an API Key, you will see this interface:

[Screenshot shows Generate new API Key button]

Click on the "Generate new API Key" button, and hit "Generate New API Key" on the pop-up dialog. WiPay will automatically generate a new API Key for you account, unlink the old API Key and use this new API Key for all operations henceforth. Your page should automatically reload and reflect your new API Key.

[Screenshot shows updated API Key "r7ss28j1rp8"]

Here we see that the API Key for this example Account was changed from "6bw2lj079aau" to "r7ss28j1rp8".

### What is the API Key of the TEST Account?

The API Key of the TEST Account is **123**.

## Appendices

### Appendix 1 - Other FGB pages

#### Success transaction summary

[Screenshot shows FGB success page with transaction details:
- Amount: $ 10.00 JMD
- Transaction State: APPROVED
- Order Id: SB-91-1-test-20210616033784
- Time: 16/06/21 22:37:54
- Ref. No.: 8465236227
- Approval Code: Y:QK8879:4565236227:PPXX:089311
- Total: 10.00
- Currency: JMD
With "Return to Shop" button]

#### Fail transaction summary

[Screenshot shows FGB failure page with transaction details:
- Amount: $ 10.00 JMD
- Transaction State: FAILED
- Error: Wrong password entered, authentication failed.
- Order Id: SB-84-1-test-20210616032823
- Time: 16/06/21 22:29:38
- Approval Code: N-5101:3D Secure authentication failed
- Total: 10.00
- Currency: JMD
With "Return to Shop" button]

#### 3DS Authentication password dialog

[Screenshots show two 3DS authentication dialogs:

1. **VISA Authentication:**
   - Merchant: WIPAY
   - Amount: JMD 10.00
   - Date: 20210616 20:39:44
   - Card Number: XXXX XXXX XXXX 4977
   - Personal Message: Secret!33
   - Password field with Help, Cancel, Submit buttons

2. **MasterCard SecureCode:**
   - Merchant: WIPAY
   - Amount: JMD 10.00
   - Date: 20210617 03:56:23
   - Card Number: XXXX XXXX XXXX 1003
   - Personal Message: Secret!23
   - Password field with Help, Cancel, Submit buttons]

---

**Copyright © 2021 by WiPay Payment Solutions Limited. All Rights Reserved.**  
**Born and bred in the Caribbean.**