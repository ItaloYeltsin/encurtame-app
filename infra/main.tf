
locals {
  aws_profile = "italo-personal"
}
provider "aws" {
  region  = "us-east-1"
  profile = "${local.aws_profile}"
}

data "aws_region" "current" {}


################################
## S3 Bucket to host static website
################################
locals {
  s3_name    = "encurtame-web-app"
}


resource "aws_s3_bucket" "encurtame" {
  bucket = local.s3_name

}

resource "aws_s3_bucket_public_access_block" "encurtame" {
  bucket = aws_s3_bucket.encurtame.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# resource "aws_s3_bucket_acl" "encurtame" {
#   bucket = aws_s3_bucket.encurtame.id
#   acl    = "private"
# }

resource "aws_s3_bucket_website_configuration" "encurtame" {
  bucket = aws_s3_bucket.encurtame.bucket

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }

}

resource "aws_s3_bucket_policy" "encurtame" {
  bucket = aws_s3_bucket.encurtame.id

  policy = jsonencode({
    Version = "2012-10-17"
    Id      = "AllowGetObjects"
    Statement = [
      {
        Sid       = "AllowPublic"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.encurtame.arn}/**"
      }
    ]
  })
}

################################
## Cloudfront
################################

locals {
  s3_origin_id   = "${local.s3_name}-origin"
  s3_domain_name = "${local.s3_name}.s3-website-${data.aws_region.current.name}.amazonaws.com"
}

resource "aws_cloudfront_distribution" "encurtame" {

  enabled = true

  origin {
    origin_id                = local.s3_origin_id
    domain_name              = local.s3_domain_name
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1"]
    }
  }

  default_cache_behavior {

    target_origin_id = local.s3_origin_id
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]

    forwarded_values {
      query_string = true

      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  price_class = "PriceClass_100"

}

################################
## Tables
################################
resource "aws_dynamodb_table" "url_table" {
  name           = "encurtame-url-table"
  hash_key       = "id"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_dynamodb_table" "user_table" {
  name           = "encurtame-user-table"
  hash_key       = "id"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  global_secondary_index {
    name               = "email-index"
    hash_key           = "email"
    projection_type    = "ALL"
    read_capacity      = 5
    write_capacity     = 5
  }

}

################################
## Iam Roles
################################

resource "aws_iam_role" "register_user_lambda" {
  name               = "register-user-lambda-role"
  assume_role_policy = file("roles/generic-lambda-assume-role.json")
}

resource "aws_iam_role" "get_url_lambda" {
  name               = "get-url-lambda-role"
  assume_role_policy = file("roles/generic-lambda-assume-role.json")
}

resource "aws_iam_role" "store_url_lambda" {
  name               = "store-url-lambda-role"
  assume_role_policy = file("roles/generic-lambda-assume-role.json")
}


resource "aws_iam_role" "encurtame_web_site_redirect" {
  name               = "encurtame-web-site-redirect-role"
  assume_role_policy = file("roles/generic-lambda-assume-role.json")
}

################################
## Policies
################################
data "aws_iam_policy_document" "register_user_lambda" {
  statement {
    actions   = ["dynamodb:PutItem", "dynamodb:ConditionCheckItem", "dynamodb:Query"]
    resources = [aws_dynamodb_table.user_table.arn]
  }
  statement {
    actions   = ["dynamodb:Query"]
    resources = ["${aws_dynamodb_table.user_table.arn}/index/email-index"]
  }
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "register_user_lambda" {
  name        = "register-user-lambda-policy"
  description = "A policy that allows register-user-lambda to put items from dynamodb"
  policy      = data.aws_iam_policy_document.register_user_lambda.json
}

data "aws_iam_policy_document" "get_url_lambda" {
  statement {
    actions   = ["dynamodb:GetItem"]
    resources = [aws_dynamodb_table.url_table.arn]
  }
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "get_url_lambda" {
  name        = "get-url-lambda-policy"
  description = "A policy that allow get-url-lambda to get items from dynamodb"
  policy      = data.aws_iam_policy_document.get_url_lambda.json
}

data "aws_iam_policy_document" "store_url_lambda" {
  statement {
    actions   = ["dynamodb:PutItem"]
    resources = [aws_dynamodb_table.url_table.arn]
  }
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "store_url_lambda" {
  name        = "store-url-lambda-policy"
  description = "A policy that allow store-url-lambda to put items in dynamodb"
  policy      = data.aws_iam_policy_document.store_url_lambda.json
}


data "aws_iam_policy_document" "encurtame_web_site_redirect" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["arn:aws:logs:*:*:*"]
  }
}

resource "aws_iam_policy" "encurtame_web_site_redirect" {
  name        = "encurtame-web-site-redirect"
  description = "allow encurtame_web_site_redirect tu write logs"
  policy      = data.aws_iam_policy_document.get_url_lambda.json
}
################################
## Policy attachments
################################
resource "aws_iam_role_policy_attachment" "register_user_lambda" {
  role       = aws_iam_role.register_user_lambda.name
  policy_arn = aws_iam_policy.register_user_lambda.arn
}

resource "aws_iam_role_policy_attachment" "get_url_lambda" {
  role       = aws_iam_role.get_url_lambda.name
  policy_arn = aws_iam_policy.get_url_lambda.arn
}

resource "aws_iam_role_policy_attachment" "store_url_lambda" {
  role       = aws_iam_role.store_url_lambda.name
  policy_arn = aws_iam_policy.store_url_lambda.arn
}

################################
## Lambdas
################################

data "archive_file" "commons_lambda_layer" {
  type       = "zip"
  source_dir = "${path.module}/../encurtame-commons-lambda"
  # excludes = [ "aws-sdk" ]
  output_path = "${path.module}/encurtame-commons-lambda.zip"
}

resource "aws_lambda_layer_version" "commons_lambda_layer" {
  filename         = data.archive_file.commons_lambda_layer.output_path
  source_code_hash = data.archive_file.commons_lambda_layer.output_base64sha256
  layer_name       = "encurtame-commons-lambda-layer"
  description      = "commons lib for developing Encurtame lambdas"

  compatible_runtimes = ["nodejs20.x"]
}

data "archive_file" "register_user_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../encurtame-register-user-lambda"
  output_path = "${path.module}/encurtame-register-user-lambda.zip"
}

resource "aws_lambda_function" "register_user_lambda" {

    function_name    = "RegisterUserLambdaFunction"
    filename         = data.archive_file.register_user_lambda.output_path
    source_code_hash = data.archive_file.register_user_lambda.output_base64sha256
    role             = aws_iam_role.register_user_lambda.arn
    environment {
      variables = {
        TABLE_NAME = aws_dynamodb_table.user_table.name
      }
    }
    handler    = "index.handler"
    runtime    = "nodejs20.x"
    timeout    = 10
    depends_on = [aws_iam_role_policy_attachment.register_user_lambda]
}

data "archive_file" "get_url_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../encurtame-get-url-lambda"
  output_path = "${path.module}/encurtame-get-url-lambda.zip"
}

resource "aws_lambda_function" "get_url_lambda" {

  function_name    = "GetUrlLambdaFunction"
  filename         = data.archive_file.get_url_lambda.output_path
  source_code_hash = data.archive_file.get_url_lambda.output_base64sha256
  role             = aws_iam_role.get_url_lambda.arn
  layers           = ["${aws_lambda_layer_version.commons_lambda_layer.arn}"]
  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.url_table.name
      LOG_LEVEL  = "DEBUG"
    }
  }
  handler    = "index.handler"
  runtime    = "nodejs20.x"
  timeout    = 10
  depends_on = [aws_iam_role_policy_attachment.get_url_lambda]
}

data "archive_file" "store_url_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/../encurtame-store-url-lambda"
  output_path = "${path.module}/encurtame-store-url-lambda.zip"
}

resource "aws_lambda_function" "store_url_lambda" {

  function_name    = "StoreUrlLambdaFunction"
  filename         = data.archive_file.store_url_lambda.output_path
  source_code_hash = data.archive_file.store_url_lambda.output_base64sha256
  role             = aws_iam_role.store_url_lambda.arn
  layers           = ["${aws_lambda_layer_version.commons_lambda_layer.arn}"]
  environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.url_table.name
    }
  }
  handler    = "index.handler"
  runtime    = "nodejs20.x"
  timeout    = 10
  depends_on = [aws_iam_role_policy_attachment.store_url_lambda]
}


data "archive_file" "encurtame_web_site_redirect" {
  type        = "zip"
  source_dir  = "${path.module}/../encurtame-redirect-to-app-lambda"
  output_path = "${path.module}/encurtame-redirect-to-app-lambda.zip"
}

resource "aws_lambda_function" "encurtame_web_site_redirect" {

  function_name    = "EncurtarWebSiteRedirect"
  role = aws_iam_role.encurtame_web_site_redirect.arn
  filename         = data.archive_file.encurtame_web_site_redirect.output_path
  source_code_hash = data.archive_file.encurtame_web_site_redirect.output_base64sha256
  environment {
    variables = {
      WEB_APP_URL = "https://${aws_cloudfront_distribution.encurtame.domain_name}"
    }
  }
  handler    = "index.handler"
  runtime    = "nodejs20.x"
  timeout    = 10
}


################################
## API Gateway
################################

resource "aws_api_gateway_rest_api" "encurtame" {
  name = "Encurtame API"

}


################################
## API Gateway Resources
################################

resource "aws_api_gateway_resource" "register_user_lambda" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
  parent_id   = aws_api_gateway_rest_api.encurtame.root_resource_id
  path_part   = "user"

}

resource "aws_api_gateway_resource" "encurtame" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
  parent_id   = aws_api_gateway_rest_api.encurtame.root_resource_id
  path_part   = "url"

}

resource "aws_api_gateway_resource" "encurtame_url_id" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
  parent_id   = aws_api_gateway_resource.encurtame.id
  path_part   = "{id}"

}

# wildcard resource for CORS
resource "aws_api_gateway_resource" "encurtame_wildcard" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
  parent_id   = aws_api_gateway_rest_api.encurtame.root_resource_id
  path_part   = "{proxy+}"

}
################################
## API Gateway Methods
################################

resource "aws_api_gateway_method" "register_user_lambda" {
  rest_api_id   = aws_api_gateway_rest_api.encurtame.id
  resource_id   = aws_api_gateway_resource.register_user_lambda.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "get_url_lambda" {
  rest_api_id   = aws_api_gateway_rest_api.encurtame.id
  resource_id   = aws_api_gateway_resource.encurtame_url_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "store_url_lambda" {
  rest_api_id   = aws_api_gateway_rest_api.encurtame.id
  resource_id   = aws_api_gateway_resource.encurtame.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "encurtame_web_site" {
  rest_api_id   = aws_api_gateway_rest_api.encurtame.id
  resource_id   = aws_api_gateway_rest_api.encurtame.root_resource_id
  http_method   = "GET"
  authorization = "NONE"
}

################################
## API Gateway Integrations
################################

resource "aws_api_gateway_integration" "register_user_lambda" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
  resource_id = aws_api_gateway_resource.register_user_lambda.id
  http_method = aws_api_gateway_method.register_user_lambda.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.register_user_lambda.invoke_arn
  depends_on              = [aws_lambda_function.register_user_lambda]
}

resource "aws_api_gateway_integration" "get_url_lambda" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
  resource_id = aws_api_gateway_resource.encurtame_url_id.id
  http_method = aws_api_gateway_method.get_url_lambda.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.get_url_lambda.invoke_arn
  depends_on              = [aws_lambda_function.get_url_lambda]
}

resource "aws_api_gateway_integration" "store_url_lambda" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
  resource_id = aws_api_gateway_resource.encurtame.id
  http_method = aws_api_gateway_method.store_url_lambda.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.store_url_lambda.invoke_arn
}

resource "aws_api_gateway_integration" "encurtame_web_site" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
  resource_id = aws_api_gateway_rest_api.encurtame.root_resource_id
  http_method = aws_api_gateway_method.encurtame_web_site.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.encurtame_web_site_redirect.invoke_arn

}

################################
## API Gateway Deployments
################################
resource "aws_api_gateway_deployment" "encurtame" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
  depends_on = [ aws_api_gateway_integration.encurtame_web_site, aws_api_gateway_integration.get_url_lambda, aws_api_gateway_integration.store_url_lambda ]
}

resource "aws_api_gateway_stage" "encurtame" {
  deployment_id = aws_api_gateway_deployment.encurtame.id
  rest_api_id   = aws_api_gateway_rest_api.encurtame.id
  stage_name    = "Dev"
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.encurtame.arn
    format          = "{ \"requestId\":\"$context.requestId\", \"ip\": \"$context.identity.sourceIp\", \"requestTime\":\"$context.requestTime\", \"httpMethod\":\"$context.httpMethod\",\"routeKey\":\"$context.routeKey\", \"status\":\"$context.status\",\"protocol\":\"$context.protocol\", \"responseLength\":\"$context.responseLength\", \"integrationError\": \"$context.integrationErrorMessage\" }"
  }
  depends_on = [aws_api_gateway_account.main]
}

################################
## API Gateway Permissions
################################
resource "aws_lambda_permission" "register_user_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.register_user_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.encurtame.execution_arn}/*/*/user"
}

resource "aws_lambda_permission" "get_url_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_url_lambda.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.encurtame.execution_arn}/*/*/url/*"
}

resource "aws_lambda_permission" "store_url_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.store_url_lambda.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_api_gateway_rest_api.encurtame.execution_arn}/*/*/url"

}

resource "aws_lambda_permission" "encurtame_web_site_redirect" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.encurtame_web_site_redirect.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.encurtame.execution_arn}/*/GET/"
}


################################
## Logging
################################
resource "aws_api_gateway_method_settings" "encurtame" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
  stage_name  = aws_api_gateway_stage.encurtame.stage_name
  method_path = "*/*"
  settings {
    logging_level      = "INFO"
    data_trace_enabled = true
    metrics_enabled    = true
  }
}

resource "aws_cloudwatch_log_group" "encurtame" {
  name              = "/aws/api-gateway/encurtame"
  retention_in_days = 7
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.main.arn
}

resource "aws_iam_role" "main" {
  name = "api-gateway-logs-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "apigateway.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

}

resource "aws_iam_role_policy_attachment" "main" {
  role       = aws_iam_role.main.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_cloudwatch_log_group" "register_user_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.register_user_lambda.function_name}"
  retention_in_days = 1
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "get_url_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.get_url_lambda.function_name}"
  retention_in_days = 1
  lifecycle {
    prevent_destroy = false
  }
}

resource "aws_cloudwatch_log_group" "store_url_lambda" {
  name              = "/aws/lambda/${aws_lambda_function.store_url_lambda.function_name}"
  retention_in_days = 1
  lifecycle {
    prevent_destroy = false
  }
}

################################
## Cors Config
################################

module "cors" {
  source  = "squidfunk/api-gateway-enable-cors/aws"
  version = "0.3.3"

  api_id          = aws_api_gateway_rest_api.encurtame.id
  api_resource_id = aws_api_gateway_resource.encurtame_wildcard.id
}

################################
## Deploy Website App
################################

# uploads resource to bucket

data "archive_file" "website_app" {
  type        = "zip"
  source_dir = "${path.module}/../encurtame-web-app/dist"
  output_path = "encutarme-web-app.zip"
}

resource "null_resource" "remove_and_upload_to_s3" {
  triggers = {
    source_hash = data.archive_file.website_app.output_base64sha256
  }
  provisioner "local-exec" {
    command = "aws s3 sync ${path.module}/../encurtame-web-app/dist s3://${aws_s3_bucket.encurtame.id} --profile ${local.aws_profile}"
  }
}

## end of provisioning
output "base_url" {
  value = aws_api_gateway_deployment.encurtame.invoke_url
}

output "s3_url" {
  value = aws_s3_bucket.encurtame.website_endpoint
}

output "cloudfront_url" {
  value = aws_cloudfront_distribution.encurtame.domain_name
}
