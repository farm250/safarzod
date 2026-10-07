-- Скрипт создания таблицы для задания 'Моё первое приложение с базой данных'
-- Вставьте этот код в Supabase -> SQL Editor -> New query -> Run

-- 1. Создаем таблицу vibes
CREATE TABLE IF NOT EXISTS vibes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  tag TEXT DEFAULT '💡 Идея',
  likes INTEGER DEFAULT 0
);

-- 2. Включаем Row Level Security (RLS)
ALTER TABLE vibes ENABLE ROW LEVEL SECURITY;

-- 3. Создаем политики для открытого чтения, добавления, обновления и удаления
-- Чтение (SELECT) для всех посетителей:
CREATE POLICY "Allow public read access"
ON vibes FOR SELECT
USING (true);

-- Добавление (INSERT) для всех посетителей:
CREATE POLICY "Allow public insert access"
ON vibes FOR INSERT
WITH CHECK (true);

-- Лайки / редактирование (UPDATE) для всех посетителей:
CREATE POLICY "Allow public update access"
ON vibes FOR UPDATE
USING (true)
WITH CHECK (true);

-- Удаление (DELETE) для всех посетителей:
CREATE POLICY "Allow public delete access"
ON vibes FOR DELETE
USING (true);

-- 4. Добавим пару начальных записей для проверки
INSERT INTO vibes (author, content, tag, likes)
VALUES 
  ('Ментор', 'Поздравляю с подключением первой базы данных! Всё работает отлично 🚀', '🚀 Вайбкодинг', 5),
  ('Студент 26-DCPS-01', 'Проверяю работу с телефона и компьютера — данные сохраняются!', '🔥 Учеба', 2);
