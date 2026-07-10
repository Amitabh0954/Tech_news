import asyncio

import asyncpg


async def test_connection():
    try:
        # Try with the @ in password
        conn = await asyncpg.connect(
            host='localhost',
            port=5432,
            user='postgres',
            password='amit@0954',
            database='Tech_news'
        )
        await conn.close()
        print("✅ Direct asyncpg connection works with amit@0954!")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

asyncio.run(test_connection())
