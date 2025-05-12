# [DEPRECATED] Auth0 Setup Instructions

> **WARNING: This document is deprecated. Auth0 has been removed from the project in favor of JWT authentication.**

## Navigation

- [Main Project README](../README.md)
- [Environment Setup Guide](./ENVIRONMENT-SETUP.md)

## Table of Contents
- [Overview](#overview)
- [Deprecation Notice](#deprecation-notice)
- [JWT Authentication](#jwt-authentication)

## Overview

This document previously provided instructions for setting up Auth0 authentication in the SparrowX project. Auth0 has been removed from the project in favor of JWT authentication.

## Deprecation Notice

AUTH0 authentication has been completely removed from this project. All references to Auth0 in this document are kept for historical purposes only. Please refer to the JWT authentication setup documentation for current authentication implementation details.

## JWT Authentication

The project now uses JWT (JSON Web Tokens) for authentication. For setup instructions, please refer to the [Environment Setup Guide](./ENVIRONMENT-SETUP.md).

Key differences with the new JWT authentication:

1. No external authentication service dependency
2. Direct authentication using the application's database
3. JWT tokens are generated and validated by the application
4. Token-based authentication with role-based access control

For the current authentication setup, see the main [README.md](../README.md) and [Environment Setup Guide](./ENVIRONMENT-SETUP.md) documents.

All previous Auth0-specific environment variables should be replaced with JWT equivalents. 