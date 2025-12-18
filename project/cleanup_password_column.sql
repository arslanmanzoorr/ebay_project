-- Drop password_hash column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users DROP COLUMN password_hash;
        RAISE NOTICE 'Dropped password_hash column';
    ELSE
        RAISE NOTICE 'password_hash column does not exist';
    END IF;
END $$;
