-- Insert Default Admin User
INSERT INTO "public"."users" (
    "id", 
    "phone", 
    "password", 
    "name", 
    "role", 
    "isActive", 
    "isVerified", 
    "updatedAt",
    "createdAt"
) 
VALUES (
    gen_random_uuid(), 
    '9999955555', 
    '010101', 
    'System Admin', 
    'operations_manager', 
    true, 
    true, 
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
