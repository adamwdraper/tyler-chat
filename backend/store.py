from sqlalchemy import text

class ThreadStore:
    async def delete(self, thread_id: str) -> bool:
        """Delete a thread by ID"""
        async with self.engine.begin() as conn:
            result = await conn.execute(
                text("DELETE FROM threads WHERE id = :thread_id"),
                {"thread_id": thread_id}
            )
            return result.rowcount > 0

    async def delete_messages(self, thread_id: str) -> bool:
        """Delete all messages for a thread"""
        async with self.engine.begin() as conn:
            result = await conn.execute(
                text("DELETE FROM messages WHERE thread_id = :thread_id"),
                {"thread_id": thread_id}
            )
            return result.rowcount > 0 