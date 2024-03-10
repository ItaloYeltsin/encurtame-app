
provider "aws" {
  region  = "us-east-1"
  profile = "italo-personal"
}

data "aws_region" "current" {}

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

################################
## Iam Roles
################################
resource "aws_iam_role" "get_url_lambda" {
  name               = "get-url-lambda-role"
  assume_role_policy = file("roles/generic-lambda-assume-role.json")
}

resource "aws_iam_role" "store_url_lambda" {
  name               = "store-url-lambda-role"
  assume_role_policy = file("roles/generic-lambda-assume-role.json")
}


################################
## Policies
################################

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



################################
## Policy attachments
################################
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

################################
## API Gateway
################################

resource "aws_api_gateway_rest_api" "encurtame" {
  name = "Encurtame API"

}


################################
## API Gateway Resources
################################
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

################################
## API Gateway Methods
################################
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

################################
## API Gateway Integrations
################################
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



################################
## API Gateway Deployments
################################
resource "aws_api_gateway_deployment" "encurtame" {
  rest_api_id = aws_api_gateway_rest_api.encurtame.id
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
## end of provisioning
output "base_url" {
  value = aws_api_gateway_deployment.encurtame.invoke_url
}