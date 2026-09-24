import psycopg2

# Connect to default postgres database
conn = psycopg2.connect(
    host="localhost",
    port="5432",
    database="postgres",
    user="postgres",
    password="password"  # Change this to your PostgreSQL password
)

conn.autocommit = True
cursor = conn.cursor()

try:
    # Create database
    cursor.execute("CREATE DATABASE landstack_db;")
    print("Database 'landstack_db' created successfully!")
    
    # Connect to new database and create extension
    conn.close()
    conn = psycopg2.connect(
        host="localhost",
        port="5432",
        database="landstack_db",
        user="postgres",
        password="password"
    )
    conn.autocommit = True
    cursor = conn.cursor()
    
    cursor.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
    print("PostGIS extension created successfully!")
    
    print("\nDatabase setup complete!")
    
except Exception as e:
    print(f"Error: {e}")
    print("\nIf database already exists or extension exists, that's fine - you can ignore these errors.")
finally:
    cursor.close()
    conn.close()
