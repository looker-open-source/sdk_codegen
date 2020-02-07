# SDK Codegen

This Looker Open Source repository is released under the MIT license. By using this repository, you agree to the terms of that license, and acknowledge that you are doing so at your own risk.

While Looker has developed and tested this code internally, we cannot guarantee that the open-source tools used by the scripts in this repository have not been modified with malicious code.

Our goal is to help people who want use Looker as a platform to get up and running quickly, largely by providing pre-built client SDKs in the most popular languages, and implementing consistency across all languages and platforms.

The Looker API is defined with the [OpenAPI specification](https://github.com/OAI/OpenAPI-Specification), formerly known as "swagger." This specification is used to produce both Looker's interactive API Explorer,and the Looker API language bindings that describes the Looker REST API.

## The parts of the Looker SDK

A Looker SDK has several parts:

- **Looker API** OpenAPI specification (e.g., found at
  `https://<your-looker-endpoint>:19999/api/3.1/swagger.json`, although this is still the Swagger 2.x representation)

- The **Looker API Explorer**, provided in the Looker web app directly from our version-specific OpenAPI specification, available in each Looker server instance.

- **Language SDKs**, "smarter" client language classes and methods to improve the experience of calling the Looker API in various popular coding languages. Looker has created a code generator for specific languages in this repository, which is invoked by the command available in this repository, `yarn sdk [language]`.

- **API bindings** using the legacy [OpenAPI Generator](https://github.com/OpenAPITools/openapi-generator) can also be produced. This process converts the API specification to language-specific code. Most of these template-based generators are written by different language enthusiasts, so the pattern and quality of the generated code varies widely, even though most generated code tends to work acceptably.


## Multi-API support with Looker 7.2 and later

Looker 7.2 introduces an **Experimental** version of API 4.0. Therefore, the SDKs now support multiple API versions in the same SDK package.
 
The main change to the SDKs is that `api_version` is no longer used from any configuration value. Instead, for all SDKs but Swift, API-specific SDKs are now created and put in the same SDK package, and share the same run-time code.

API 3.0 is not included. At the time of this writing, API 3.1 and API 4.0 are included in most SDK packages. For an SDK that supports multiple API versions, there will be a `methods.*` and `models.*` generated for each API version. 

The class names representing these API versions are distinct, and factories for creating initialized SDK objects are also distinctly named.

These API-specific files still use all the same Run-Time Library (RTL) code in the SDK package, so code duplication is minimized.

Please review the following table for a breakdown of the options to initialize the desired SDK object.

| SDK | API 3.1 | API 4.0 | Notes                                                                                                                                                           |
| ---- | ------ | --------| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Python  | `looker_sdk.init31()` | `looker_sdk.init40()` | Both API 3.1 and 4.0 are supported, and can be initialized with the functions shown                                                   |
| Typescript | `Looker31SDK()`, `LookerNodeSDK.init31()`, or `LookerBrowserSDK.init31()` | `Looker40SDK()`, `LookerNodeSDK.init40()` or `LookerBrowserSDK.init40()` | Both API 3.1 and 4.0 are supported and can be initialized with the functions shown | 
| Kotlin  | Do not use | `Looker40SDK()` | API 4.0 was specifically created to correct the endpoint payloads for strongly-typed languages like Kotlin and Swift |
| Swift | Not applicable | `Looker40SDK()` | Swift only has SDK definitions for API 4.0 |                                                                                                     |


## Using existing, pre-generated SDKs

When a specific language SDK has been developed, Looker makes that SDK available using the standard package manager for by that platform. Currently, there are two client language SDKs Looker has deployed to package managers. If you want to use our Python or Node/Typescript/Javascript SDKs, you don't need to run the generator in this repository at all. You can add it using `pip` or `node/yarn` and start writing your Looker SDK application.

### Installing the Python SDK

Instructions for using the Looker SDK for Python are at <https://pypi.org/project/looker-sdk>. The source for this package's documentation is at [python/README.rst](python/README.rst).

### Installing the Typescript/Javascript SDK

Instructions for the Looker SDK for Typescript/Javascript are at <https://www.npmjs.com/package/@looker/sdk>. The source for this package's documentation is at [typescript/looker/README.md](typescript/looker/README.md).

If you do want to use the generation options for another language, read on.

## Generating an API language binding

There are three steps for generating an SDK with this project:

- configure a `looker.ini` file so the Looker API specification can be retrieved from your Looker server.

  - **Note**: previous versions of the `looker.ini` file had an `api_version` entry. This is no longer required. The code generator project will read an `api_versions` value if that is found, but the SDKs ignore this value. If `api_versions` is not found in the `ini` file, it defaults to "3.1,4.0" for the generator to produce the definitions for the supported API versions.

- install the code generator dependencies by running `yarn`.

- run the SDK generator with `yarn sdk`

- **Note**: [Generating Client SDKs for the Looker API](https://discourse.looker.com/t/generating-client-sdks-for-the-looker-api/3185) describes the legacy, manual steps for generating an API language binding. This project replaces these manual steps, and uses an improved code generator.

## Configuring `looker.ini`

The code generator reads a configuration file `looker.ini` to fetch the API specification from a server. This configuration file needs to be in the same folder as the code generator.

To create `looker.ini`, copy [`looker-sample.ini`](looker-sample.ini) to `looker.ini` and fill in the required values. The values for `client_id` and `client_secret` can be retrieved by navigating to `https://<your_looker_endpoint>/admin/users`, editing your user, editing API3 keys, and clicking the "reveal" button to view your `client_id` and `client_secret`. If there are currently no API3 credentials, they can be generated by clicking “New API3 Key.”

For your own source code repositories, be sure to configure your version control system to ignore the SDK configuration `.ini` file so it doesn't accidentally get published somewhere unauthorized people can see it.

Unlike some other OpenAPI code generators, the Looker SDK code generator **never** writes access information into SDK source code.
All SDKs provided by Looker are designed to receive the credentials required to call API methods.

### Using the code generator

If `yarn` is not installed, use [these instructions to install](https://yarnpkg.com/lang/en/docs/install/) it.

After yarn is installed, just run `yarn` from your terminal window/command line, and it will download or update all the packages required to run the code generator. The resources required to run the code generator are listed in [package.json](package.json).

Invoke the SDK code generator with the command:

```bash
yarn sdk
```

The code generator will:

- read the Looker API configuration(s) from the `looker.ini` file.

  - **Note**: Normally there should only be one (1) entry in `looker.ini`. This first ini section is what is used for the SDKs by default, and also by the code generator.

- download (if the API specification file is not already present) the Looker API specification file(s) from the configured Looker server(s)

- convert (if the converted file is not already present) the downloaded Swagger 2 specification file(s) to OpenAPI 3.x

- validate the OpenAPI 3.x file(s)

- by default, call the code generator for each active language configured in [`languages.ts`](src/languages.ts)

  - If you want to generate for one specific language, use `yarn sdk {language}`. Currently, supported `{language}` values are `kotlin`, `python`, `swift` and `typescript`

When the generator completes successfully, the output will be similar to:

```plain-text
python
  looker
    rtl
      (run-time library hand-written files here)
    sdk
      methods.py (automatically generated)
      models.py (automatically generated)
typescript
  looker
    rtl
      (run-time library hand-written files here)
    sdk
      methods.ts (automatically generated)
      models.ts (automatically generated)
```

**Note:** If you're unable to download the API specification file because you're using an instance of Looker that is self-signed and errors are being thrown, you can explicitly turn off SSL verification by putting `verify_ssl=false` in the `looker.ini` file configuration section.

#### View the specification interactively

When the specification conversion completes successfully, the OpenAPI 3.x specification file is available locally, so you can search and explore the api using a command similar to the following:

```bash
yarn view Looker.3.1.oas.json
```

This command will start a local web server that allows you to browse and search the indicated specification file.

**Tip**: search for `query` or `dashboard` in the UI and see what you get!

### Using the Legacy generator

To generate a language currently not supported by Looker's SDK code generator with the OpenAPI generator:

- configure the desired language in [`languages.ts`](src/languages.ts)

- use `yarn legacy` to call the OpenAPI generator

#### Additional scripts

Use

```bash
yarn run
```

to see the list of all scripts that can be run by the code generator.

## SDK Examples

The open source repository <https://github.com/looker-open-source/sdk-examples> contains code snippets and projects written using the Looker language SDKs. You may find useful code in that repository. and are also welcome to contribute additional examples.

## Running Integration Tests

These are notes for the integration tests Looker is developing and are left here for reference in case you want to establish your own integration testing process.

In order to run the integration tests you will need:

- [docker](https://docs.docker.com/install/#support)
- [docker-compose](https://docs.docker.com/compose/install/)

Which we use to isolate the various supporting libraries required to test the SDK in a given language.

You will also need to copy the `looker-sample.ini` to `looker.ini` and fill out
the necessary details so it can reach your running _Looker_ instance.

First, you will need to build the base:

```bash
docker-compose build base
```

Then to build a specific language integration testing image you simply execute:

```bash
docker-compose build [language]
```

Where language comes from the directories `sdk-codegen/docker/*` and we'd build the docker image to support running those tests. At this point you can run the existing tests from inside that container pointed at the instance you identified in `looker.ini` like so:

```bash
docker-compose run [language]
```

## API Troubleshooting

See the official documentation for [API Troubleshooting](https://docs.looker.com/reference/api-and-integration/api-troubleshooting) suggestions.

## Notes

In addition to swagger being deprecated, this [visual guide](https://blog.readme.io/an-example-filled-guide-to-swagger-3-2/) shows why OpenAPI 3.x is preferred to Swagger 2.x.

## Securing your SDK credentials

Looker improves on the security of the generated code for SDKs by **never** storing your server location or API credentials in the source code generated by the Looker code generator. The SDKs also provide some simplified support for providing location and credential information to the SDK.

Please consult with the security professionals in your organization to determine the best way to secure your credentials for your own Looker SDK usage.

### Warnings for using `.ini` files to configure the SDK

To streamline getting started with the Looker SDKs, support for reading SDK credentials from an `.ini` file is included as a simple method for providing access information (server url and API credentials) to the SDK. If the source code to your Looker SDK application is shared in a version control system, the `.ini` file should be ignored so it never gets inadvertently published.

If the SDK application using an `.ini` file is available publicly, download or viewing of this `.ini` file should also be prohibited by the server hosting the application.

### Warnings for using Environment variables to configure the SDK

If the host environment for a Looker SDK supports environment variables, the SDK can also read environment variables to retrieve the server url and API credentials. Environment variables could also be visible to intrusive malware that may penetrate your application, so this option for providing credentials should also be used with caution.

## Environment variable configuration

Environment variables can be used for any SDK runtime that supports reading environment variables. Environment variables can be used in the:

- **Node** version of the Typescript/Javascript Looker SDK
- Python SDK
- Swift SDK
- Kotlin SDK

The following table describes the environment variables. By default, the SDK "namespace" is "LookerSDK" which is converted to UPPERCASE when used for naming environment variables.

| Variable name           | Description                                                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LOOKERSDK_BASE_URL      | A URL like `https://my.looker.com:19999`. No default value.                                                                                                           |
| LOOKERSDK_API_VERSION   | Version of the Looker API to use. Use `3.1` for now, which is the default and used to produce this SDK.                                                               |
| LOOKERSDK_VERIFY_SSL    | `true`, `t`, `yes`, `y`, or `1` (case insensitive) to enable SSL verification. Any other value is treated as `false`. Defaults to `true` if not set.                  |
| LOOKERSDK_TIMEOUT       | Request timeout in seconds. Defaults to `120` for most platforms.                                                                                                     |
| LOOKERSDK_CLIENT_ID     | API3 credentials `client_id`. This and `client_secret` must be provided in some fashion to the Node SDK, or no calls to the API will be authorized. No default value. |
| LOOKERSDK_CLIENT_SECRET | API3 credentials `client_secret`. No default value.                                                                                                                   |

## SDK Examples

Looker hosts an open source repository for SDK examples at <https://github.com/looker-open-source/sdk-examples>. We welcome members of the community to submit additional examples.
