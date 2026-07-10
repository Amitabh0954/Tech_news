import asyncio

import asyncpg


async def test_credentials():
    """Test different PostgreSQL credentials"""
    
    attempts = [
        {"user": "postgres", "password": "amit@0954", "db": "Tech_news"},
        {"user": "postgres", "password": "", "db": "Tech_news"},
        {"user": "postgres", "password": "postgres", "db": "Tech_news"},
        {"user": "postgres", "password": None, "db": "postgres"},
    ]
    
    for attempt in attempts:
        try:
            print(f"\nTrying: user={attempt['user']}, password={'***' if attempt.get('password') else 'none'}, db={attempt['db']}")
            conn = await asyncpg.connect(
                host='localhost',
                port=5432,
                user=attempt['user'],
                password=attempt.get('password'),
                database=attempt['db']
            )
            
            # Get database info
            result = await conn.fetchval("SELECT version();")
            print("✅ SUCCESS! Connected to PostgreSQL")
            print(f"   Version: {result[:50]}...")
            
            # List databases
            dbs = await conn.fetch("SELECT datname FROM pg_database WHERE datistemplate = false;")
            print(f"   Databases: {[db['datname'] for db in dbs]}")
            
            await conn.close()
            return attempt
            
        except Exception as e:
            print(f"❌ Failed: {e}")
    
    return None

result = asyncio.run(test_credentials())
if result:
    print(f"\n✅ Use these credentials: {result}")
else:
    print("\n⚠️  Could not connect with any credential combination")
