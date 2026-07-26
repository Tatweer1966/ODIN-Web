# Security Architecture

## Current controls
- Internal username/email and password authentication
- bcrypt password hashing
- JWT access tokens with 30-minute lifetime
- Role-based permissions
- Active-user enforcement
- Protected frontend routes
- Protected `/api/auth/me` endpoint

## Development administrator
- Username: `admin`
- Password: `ChangeMe123!`

The development password must be replaced before production deployment.