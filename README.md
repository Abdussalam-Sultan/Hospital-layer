# Hospital Patient Records API

Backend documentation for the Hospital Patient Records access-control service. This guide is for a new frontend client; the existing frontend is not part of the API contract and may be replaced entirely.

The service is an Express API backed by Sequelize and MySQL. It provides staff authentication, shift-based patient access, role-based data visibility, audited emergency access, admin shift management, and a tamper-evident SHA-256 audit chain.

## Quick Start

### Requirements

- Node.js 18 or later.
- MySQL 8 or another Sequelize-supported database configured for this project.
- A database created before starting the server.

### Configuration

```bash
npm install
```

Create a `.env` file using either individual database settings:

```env
PORT=3000
JWT_SECRET=replace-this-with-a-long-random-secret
DB_DIALECT=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your-password
DB_NAME=hospitaldb
```

Or a database URL:

```env
DB_URL=mysql://user:password@host:3306/hospitaldb
DB_DIALECT=mysql
```

`JWT_SECRET` must be stable across restarts. Changing it invalidates existing tokens. Do not use the repository fallback secret in production.

### Start

```bash
npm start
```

The default base URL is `http://localhost:3000`. For development:

```bash
npm run dev
```

The server synchronizes the Sequelize schema on startup. If the staff table is empty, it automatically seeds demo data. `npm run seed` is destructive and should only be used for local development.

## API Conventions

### Base URL

All paths below are relative to:

```text
http://localhost:3000
```

The API returns JSON and expects `Content-Type: application/json` for documented JSON bodies.

### JWT authentication

First call `POST /auth/login`. Send the returned token on authenticated requests:

```http
Authorization: Bearer <jwt>
```

Tokens expire after 24 hours. There is no refresh-token endpoint; the client must sign in again after expiry.

### Status codes

| Status | Meaning |
| --- | --- |
| `200` | Request succeeded. |
| `400` | Missing/invalid input or invalid current state. |
| `401` | Missing, malformed, invalid, or expired JWT; or invalid credentials. |
| `403` | Authenticated user lacks permission or is outside the permitted ward. |
| `404` | Patient, staff member, ward, or log entry was not found. |
| `500` | Unexpected server or database failure. |

Most errors use `{ "error": "..." }`; some include `details`.

## Roles and Access Rules

Roles are `admin`, `doctor`, `nurse`, and `clerk`.

| Role | `GET /patients` | DOB and diagnosis | Emergency access | Admin/audit APIs |
| --- | --- | --- | --- | --- |
| `admin` | All wards | Full values | Yes | Yes |
| `doctor` | Active shift ward | Full values | Yes | No |
| `nurse` | Active shift ward | Full values | Yes | No |
| `clerk` | Active shift ward | Replaced with `Restricted: clinical staff only` | No | No |

Normal chart access is evaluated using the staff member's active shift at request time. Non-admin users can access only patients in that ward. A non-admin with no active shift cannot access normal charts. Admins can access any ward.

Emergency access is the deliberate exception for doctors, nurses, and admins. It requires a non-empty reason and always creates an audit event. Clerks receive `403`.

## Endpoint Index

### Authentication

- `POST /auth/login`

### Patients

- `GET /patients`
- `GET /patients/:id`
- `POST /patients/:id/emergency-access`

### Admin

- `POST /admin/reassign-shift`
- `POST /admin/anchor-now`

### Audit logs

- `GET /logs`
- `GET /logs/verify`
- `GET /logs/overrides/summary`

### Health, metadata, and testing

- `GET /api/health`
- `GET /api/meta`
- `GET /api/all-patients`
- `GET /api/overview`
- `POST /api/test/tamper`
- `POST /api/test/reseed`

The `/api` routes currently do not require authentication. The testing routes are local-development endpoints and must be protected or removed before deployment.

## Authentication API

### POST `/auth/login`

Authenticates a staff member with a staff ID and password. A successful login appends a `LOGIN` audit event.

#### Request

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "staffId": "doc-meredith-grey",
  "password": "password123"
}
```

The password is compared with the stored bcrypt hash and is never returned.

#### Response `200`

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "staff": {
    "id": "doc-meredith-grey",
    "name": "Dr. Meredith Grey",
    "role": "doctor",
    "currentShiftWardId": 1,
    "currentWard": "Ward 1"
  }
}
```

`currentShiftWardId` is `null` when no active shift exists. JWT claims contain `staffId`, `role`, and `currentShiftWardId`.

Missing fields return `400`:

```json
{
  "error": "staffId and password are required"
}
```

Unknown staff IDs and incorrect passwords return `401` with:

```json
{
  "error": "Invalid staff ID or password"
}
```

The API intentionally uses the same response for both invalid-credential cases.

## Patient API

### GET `/patients`

Returns the authenticated user's visible patients.

- Admins receive every patient in every ward.
- Doctors, nurses, and clerks receive patients in their active shift ward.
- A non-admin with no active shift receives `[]`.
- Clerk responses mask `dob` and `diagnosis`.

#### Request

```http
GET /patients
Authorization: Bearer <jwt>
```

#### Response `200`

```json
[
  {
    "id": "pat-101",
    "name": "Eleanor Vance",
    "dob": "1982-04-14",
    "ward_id": 1,
    "diagnosis": "Acute Appendicitis (Pre-Op)",
    "admitted_at": "2026-09-11T10:00:00.000Z",
    "ward_name": "Ward 1"
  }
]
```

`dob` is a date string. `admitted_at` is an ISO date-time string. For clerks, the sensitive fields are returned as:

```json
{
  "dob": "Restricted: clinical staff only",
  "diagnosis": "Restricted: clinical staff only"
}
```

### GET `/patients/:id`

Returns one patient after evaluating the current active shift and role.

#### Request

```http
GET /patients/pat-101
Authorization: Bearer <jwt>
```

#### Response `200`

Returns one patient object with the same fields as `GET /patients`, sanitized for the caller's role.

#### Cross-ward response `403`

A non-admin requesting a patient outside the active shift ward receives no patient data, and a `DENIED` audit event is appended:

```json
{
  "error": "You are not currently assigned to this patient's ward.",
  "details": {
    "staffCurrentWard": "Ward 1",
    "patientWard": "ICU"
  }
}
```

An unknown patient returns `404`:

```json
{
  "error": "Patient record not found"
}
```

### POST `/patients/:id/emergency-access`

Uses the break-glass process to access a patient regardless of ward. The action is written to the audit chain.

Allowed roles: `admin`, `doctor`, `nurse`.

#### Request

```http
POST /patients/pat-119/emergency-access
Authorization: Bearer <jwt>
Content-Type: application/json
```

```json
{
  "reason": "Patient acute respiratory failure; immediate airway support requested"
}
```

`reason` must be a non-empty string after trimming whitespace.

#### Response `200`

```json
{
  "message": "Emergency override access granted.",
  "accessType": "EMERGENCY_OVERRIDE",
  "patient": {
    "id": "pat-119",
    "name": "Thomas Shelby",
    "dob": "1970-08-11",
    "ward_id": 4,
    "diagnosis": "Septic Shock (Vasopressor dependent)",
    "admitted_at": "2026-09-09T00:00:00.000Z",
    "ward_name": "ICU"
  }
}
```

The patient object is sanitized according to role. A clerk receives `403`:

```json
{
  "error": "Emergency override is restricted to doctors, nurses, and administrators."
}
```

Missing or blank reasons receive `400`:

```json
{
  "error": "Emergency access requires a mandatory, non-empty reason."
}
```

## Admin API

Every `/admin` endpoint requires a valid JWT whose role is `admin`. Authenticated non-admin users receive `403`:

```json
{
  "error": "Forbidden: Admin access required"
}
```

### POST `/admin/reassign-shift`

Ends the target staff member's current active shift and creates a new active shift in the requested ward. The new assignment affects patient authorization immediately.

#### Request

```http
POST /admin/reassign-shift
Authorization: Bearer <admin-jwt>
Content-Type: application/json
```

```json
{
  "staffId": "doc-meredith-grey",
  "newWardId": 4
}
```

`wardId` is also accepted as a compatibility alias for `newWardId`.

#### Response `200`

```json
{
  "message": "Staff member Dr. Meredith Grey (doc-meredith-grey) reassigned to ICU immediately.",
  "previousShift": {
    "id": "existing-shift-id",
    "staff_id": "doc-meredith-grey",
    "ward_id": 1,
    "start_time": "2026-09-12T08:00:00.000Z",
    "end_time": "2026-09-12T12:00:00.000Z"
  },
  "newShift": {
    "id": "new-uuid",
    "staff_id": "doc-meredith-grey",
    "ward_id": 4,
    "ward_name": "ICU",
    "start_time": "2026-09-12T12:00:00.000Z",
    "end_time": null
  }
}
```

Missing IDs return `400`. An unknown ward or staff member returns `404`.

### POST `/admin/anchor-now`

Creates a checkpoint containing the latest audit log entry's hash and ID.

#### Request

```http
POST /admin/anchor-now
Authorization: Bearer <admin-jwt>
```

No body is required.

#### Response `200`

```json
{
  "message": "Chain anchor successfully recorded.",
  "anchor": {
    "id": 1,
    "anchor_hash": "64-character-sha256-hex-value",
    "row_id_at_anchor": 12,
    "created_at": "2026-09-12T12:00:00.000Z"
  }
}
```

If there are no audit logs, the response is `400`:

```json
{
  "error": "Cannot anchor: access_logs is currently empty. Perform some access operations first."
}
```

The server also attempts to create an anchor automatically every two minutes.

## Audit Log API

All `/logs` endpoints require a valid admin JWT. Logs are newest first and record `LOGIN`, `VIEW_RECORD`, `EMERGENCY_ACCESS`, and `DENIED` events.

### GET `/logs`

Returns paginated audit entries.

#### Query parameters

| Parameter | Default | Rules |
| --- | ---: | --- |
| `limit` | `50` | Parsed as an integer and clamped to `1..500`. |
| `offset` | `0` | Parsed as an integer and clamped to a minimum of `0`. |

#### Request

```http
GET /logs?limit=25&offset=0
Authorization: Bearer <admin-jwt>
```

#### Response `200`

```json
{
  "total": 42,
  "limit": 25,
  "offset": 0,
  "logs": [
    {
      "id": 42,
      "staff_id": "doc-meredith-grey",
      "patient_id": "pat-119",
      "action": "EMERGENCY_ACCESS",
      "result": "GRANTED",
      "reason": "Immediate airway support requested",
      "staff_ward_at_time": "Ward 1",
      "patient_ward_at_time": "ICU",
      "timestamp": "2026-09-12T12:00:00.000Z",
      "prev_hash": "previous-64-character-sha256-hex-value",
      "entry_hash": "current-64-character-sha256-hex-value"
    }
  ]
}
```

### GET `/logs/verify`

Recomputes the SHA-256 chain from the genesis hash, validates each `prev_hash` and `entry_hash`, and checks the latest checkpoint anchor.

#### Request

```http
GET /logs/verify
Authorization: Bearer <admin-jwt>
```

#### Valid response `200`

```json
{
  "valid": true,
  "totalEntries": 42,
  "lastAnchorCheckedAt": "2026-09-12T12:00:00.000Z"
}
```

With no logs, `valid` is `true`, `totalEntries` is `0`, and `lastAnchorCheckedAt` is the latest anchor time or `null`.

Tampering still returns HTTP `200`, but with `valid: false`:

```json
{
  "valid": false,
  "brokenAtId": 42,
  "reason": "Hash mismatch at row id 42. Data has been altered."
}
```

A frontend must treat `valid: false` as a security alert.

### GET `/logs/overrides/summary`

Ranks staff by the number of `EMERGENCY_ACCESS` events.

#### Request

```http
GET /logs/overrides/summary
Authorization: Bearer <admin-jwt>
```

#### Response `200`

```json
{
  "description": "Staff members ranked by emergency override frequency",
  "totalEmergencyOverrides": 3,
  "rankings": [
    {
      "staff_id": "doc-meredith-grey",
      "staff_name": "Dr. Meredith Grey",
      "staff_role": "doctor",
      "emergency_access_count": 3,
      "last_emergency_access_at": "2026-09-12T12:00:00.000Z"
    }
  ]
}
```

With no overrides, `rankings` is `[]` and `totalEmergencyOverrides` is `0`.

## Health, Metadata, and Testing API

These routes are currently unauthenticated.

### GET `/api/health`

Checks database connectivity.

#### Response `200`

```json
{
  "status": "ok",
  "database": "mysql",
  "engine": "MySQL 8.0",
  "mysqlVersion": "8.0.36",
  "versionComment": "MySQL Community Server",
  "orm": "sequelize",
  "timestamp": "2026-09-12T12:00:00.000Z"
}
```

Database failure returns `500` with `status: "error"`, database/ORM information, and the database error message.

### GET `/api/meta`

Returns wards, staff identity/role information, active ward assignments, aggregate counts, and the latest audit/anchor records. It never returns `password_hash`.

#### Request

```http
GET /api/meta
```

#### Response `200`

```json
{
  "database": "mysql",
  "orm": "sequelize",
  "stats": {
    "staffCount": 10,
    "wardCount": 5,
    "patientCount": 30,
    "logCount": 42,
    "anchorCount": 2
  },
  "wards": [
    { "id": 1, "name": "Ward 1" }
  ],
  "staff": [
    {
      "id": "doc-meredith-grey",
      "name": "Dr. Meredith Grey",
      "role": "doctor",
      "default_ward": "Ward 1",
      "created_at": "2026-09-12T08:00:00.000Z",
      "current_ward_id": 1,
      "current_ward_name": "Ward 1"
    }
  ],
  "latestAnchor": null,
  "latestLog": null
}
```

This endpoint exposes staff IDs, names, roles, and ward assignments without authentication. Protect it if that is sensitive in the deployment environment.

### GET `/api/all-patients`

Returns every patient across every ward without JWT role or shift filtering.

#### Request

```http
GET /api/all-patients
```

#### Response `200`

```json
[
  {
    "id": "pat-101",
    "name": "Eleanor Vance",
    "dob": "1982-04-14",
    "ward_id": 1,
    "diagnosis": "Acute Appendicitis (Pre-Op)",
    "admitted_at": "2026-09-11T10:00:00.000Z",
    "ward_name": "Ward 1"
  }
]
```

This is a development/demo endpoint that currently exposes sensitive data without authentication. A production frontend must use `GET /patients` instead, or the route must be protected before deployment.

### GET `/api/overview`

Returns a machine-readable service description, endpoint index, version, and demo credentials. It is a convenience endpoint for local development, not a security boundary.

#### Request

```http
GET /api/overview
```

The response includes endpoint names for authentication, patients, logs, and admin operations, plus the default demo password and sample staff IDs.

### POST `/api/test/tamper`

Directly modifies an audit log row without recalculating its hash. Use it only to demonstrate that `/logs/verify` detects tampering.

#### Request

```http
POST /api/test/tamper
Content-Type: application/json
```

```json
{
  "rowId": 42,
  "field": "reason",
  "newValue": "UNAUTHORIZED_ALTERATION_BY_ATTACKER"
}
```

All fields are optional. If `rowId` is omitted, the latest log row is modified. Allowed fields are `reason`, `action`, `result`, `staff_ward_at_time`, and `patient_ward_at_time`. An unsupported field falls back to `reason`.

#### Response `200`

```json
{
  "message": "Log row #42 successfully tampered directly in MySQL. Run GET /logs/verify to detect the forgery.",
  "tamperedRowId": 42,
  "fieldModified": "reason",
  "originalValue": "original reason",
  "tamperedValue": "UNAUTHORIZED_ALTERATION_BY_ATTACKER",
  "row": {}
}
```

No logs available returns `400`; an unknown row returns `404`. This route is unauthenticated in the current implementation and must never be exposed in production.

### POST `/api/test/reseed`

Runs `node seed.js`, clearing and rebuilding the database with the initial demo wards, staff, shifts, patients, and empty audit tables.

#### Request

```http
POST /api/test/reseed
```

#### Response `200`

```json
{
  "message": "Database re-seeded successfully with MySQL and Sequelize. 5 wards, 10 staff, and 30 patients restored. Audit logs cleared."
}
```

This operation is destructive and unauthenticated in the current implementation. Disable or protect it outside local development.

## Demo Staff Accounts

The seed script creates these accounts with the demo password `password123`:

| Staff ID | Name | Role | Initial ward |
| --- | --- | --- | --- |
| `doc-meredith-grey` | Dr. Meredith Grey | `doctor` | Ward 1 |
| `doc-cristina-yang` | Dr. Cristina Yang | `doctor` | ICU |
| `doc-alex-karev` | Dr. Alex Karev | `doctor` | Ward 2 |
| `doc-addison-montgomery` | Dr. Addison Montgomery | `doctor` | Maternity |
| `nurse-carol-hathaway` | Nurse Carol Hathaway | `nurse` | Ward 1 |
| `nurse-jackie-peyton` | Nurse Jackie Peyton | `nurse` | Ward 2 |
| `nurse-charlyne-yi` | Nurse Charlyne Yi | `nurse` | Ward 3 |
| `clerk-pam-beesly` | Clerk Pam Beesly | `clerk` | Ward 1 |
| `admin-miranda-bailey` | Admin Miranda Bailey | `admin` | ICU |
| `admin-richard-webber` | Admin Richard Webber | `admin` | Ward 3 |

Change or replace these credentials before any real deployment.

## Frontend Integration Flow

1. Call `GET /api/health` to verify service reachability.
2. Call `POST /auth/login` with the staff ID and password.
3. Store the JWT in an appropriate secure session mechanism and send it as a Bearer token.
4. Use `GET /patients` for the current user's permitted list.
5. Use `GET /patients/:id` when the user opens a chart.
6. On `403`, offer emergency access only to doctors, nurses, and admins. Require a reason and call `POST /patients/:id/emergency-access`.
7. Treat `401` as an authentication/session problem, `403` as authorization, `404` as missing data, and `500` as a server problem.
8. For an admin console, use `/api/meta`, `/admin/reassign-shift`, `/logs`, `/logs/verify`, `/logs/overrides/summary`, and `/admin/anchor-now`.
9. Treat `valid: false` from `/logs/verify` as a security incident even though the HTTP status is `200`.

Do not use `/api/all-patients`, `/api/test/tamper`, or `/api/test/reseed` in a production frontend.

## Audit Chain Details

Every audit entry stores:

- `prev_hash`: the previous row's `entry_hash`, or 64 zeroes for the first row.
- `entry_hash`: SHA-256 of the canonical pipe-separated entry.
- `staff_id`, `patient_id`, `action`, `result`, and `reason`.
- Staff and patient ward names at the time of the event.
- The event timestamp.

The canonical string is:

```text
prev_hash|staff_id|patient_id|action|result|reason|staff_ward_at_time|patient_ward_at_time|timestamp
```

The server appends entries for successful login, granted normal chart access, denied chart access, and emergency access. Admin anchor operations store the latest chain hash in `chain_anchors`. Automatic anchors are attempted every two minutes.

## Database Entities

- `staff`: staff ID, display name, role, default ward, bcrypt password hash, creation time.
- `wards`: ward ID and name.
- `shifts`: staff assignment history; `end_time = NULL` means active.
- `patients`: patient identity, date of birth, ward, diagnosis, and admission time.
- `access_logs`: append-only access events and hash-chain fields.
- `chain_anchors`: periodic or manual audit chain checkpoints.

## Security and Deployment Notes

This repository is a prototype and requires hardening before production use:

- Protect or remove all unauthenticated `/api` metadata, patient, tamper, reseed, and overview routes.
- Use a strong `JWT_SECRET` outside source control.
- Replace seeded demo passwords and enforce password rotation.
- Add rate limiting and account lockout for repeated login failures.
- Serve the API over HTTPS.
- Configure CORS deliberately when the frontend is separate.
- Never log passwords or JWTs.
- Consider short-lived access tokens plus a secure refresh-token flow.
- Add request validation and maximum lengths for emergency reasons.
- Review frontend caching of staff and patient data.
- Restrict database credentials to minimum required permissions.
- Disable `/api/test/tamper` and `/api/test/reseed` outside local development.

## Useful Test Sequence

Replace `<token>` and `<admin-token>` with values returned by login:

```bash
# Login as a Ward 1 doctor
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"staffId":"doc-meredith-grey","password":"password123"}'

# List the current ward's patients
curl -s http://localhost:3000/patients \
  -H "Authorization: Bearer <token>"

# Cross-ward access; expect HTTP 403
curl -i http://localhost:3000/patients/pat-119 \
  -H "Authorization: Bearer <token>"

# Audited emergency access
curl -s -X POST http://localhost:3000/patients/pat-119/emergency-access \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"reason":"Immediate emergency airway assessment required"}'

# Login as an administrator
curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"staffId":"admin-miranda-bailey","password":"password123"}'

# Inspect and verify the audit chain
curl -s "http://localhost:3000/logs?limit=50" \
  -H "Authorization: Bearer <admin-token>"
curl -s http://localhost:3000/logs/verify \
  -H "Authorization: Bearer <admin-token>"
```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies. |
| `npm run dev` | Start the server through nodemon for development. |
| `npm start` | Start the server. |
| `npm run seed` | Destructively reset the database to demo data. |
| `npm run lint` | Run Node syntax checks on backend files. |
