# 🚀 VibeBoard | Группа 26-DCPS-01

> **Задание:** Моё первое приложение с базой данных (Вайбкодинг)  
> **Стек технологий:** Next.js 16 (App Router) + TypeScript + Tailwind CSS + Supabase (PostgreSQL) + Vercel

---

## 📱 О проекте

**VibeBoard** — это веб-приложение для публикации заметок, идей и впечатлений участников учебной группы с мгновенной синхронизацией в облачной базе данных **Supabase**.

- 📱 **Mobile-First дизайн:** Удобный интерфейс, адаптированный под экраны смартфонов и планшетов.
- ☁️ **Облачная база данных Supabase:** Все записи хранятся в PostgreSQL таблице `vibes`, а не захардкожены в коде. При перезагрузке страницы данные не пропадают.
- 🔄 **Кросс-девайс синхронизация:** Запись, добавленная с мобильного телефона, мгновенно доступна при открытии сайта на компьютере.
- ❤️ **Интерактив:** Возможность ставить лайки с обновлением счетчика в БД, фильтрация по категориям и анимация конфетти при публикации.

---

## 🛠️ Быстрый старт локально

1. **Клонируйте репозиторий и установите зависимости:**
   ```bash
   npm install
   ```

2. **Настройте переменные окружения:**
   Скопируйте пример конфига:
   ```bash
   cp .env.example .env.local
   ```
   В файле `.env.local` укажите ваши ключи из проекта Supabase (`Project Settings -> API`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Запустите сервер разработки:**
   ```bash
   npm run dev
   ```
   Откройте [http://localhost:3000](http://localhost:3000) в браузере.

---

## 🗄️ Структура базы данных (Supabase SQL)

Выполните этот скрипт в разделе **Supabase -> SQL Editor**:

```sql
-- 1. Таблица записей
CREATE TABLE IF NOT EXISTS vibes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  tag TEXT DEFAULT '💡 Идея',
  likes INTEGER DEFAULT 0
);

-- 2. Включение Row Level Security
ALTER TABLE vibes ENABLE ROW LEVEL SECURITY;

-- 3. Политики безопасности (публичный доступ для демо-задания)
CREATE POLICY "Allow public read" ON vibes FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON vibes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON vibes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON vibes FOR DELETE USING (true);

-- 4. Начальные тестовые данные
INSERT INTO vibes (author, content, tag, likes)
VALUES 
  ('Ментор', 'Поздравляю с подключением первой базы данных! 🚀', '🚀 Вайбкодинг', 5),
  ('Студент 26-DCPS-01', 'Проверяю синхронизацию с телефона и ПК!', '🔥 Учеба', 2);
```

---

## 🌐 Деплой на Vercel

1. Создайте репозиторий на [GitHub](https://github.com) и запушьте проект:
   ```bash
   git add .
   git commit -m "feat: complete vibe-board app with Supabase"
   git remote add origin https://github.com/ВАШ_НИК/vibe-board.git
   git push -u origin main
   ```
2. Откройте [Vercel](https://vercel.com) -> **Add New...** -> **Project**.
3. Импортируйте репозиторий `vibe-board`.
4. В разделе **Environment Variables** добавьте:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Нажмите **Deploy**. Через 1 минуту проект будет доступен по ссылке `https://ваш-проект.vercel.app`!

---

## 📋 Чек-лист сдачи ментору
- [x] Приложение развернуто на Vercel и открывается со смартфона.
- [x] Данные хранятся в Supabase (`vibes`).
- [x] Сделан скриншот таблицы в Supabase Table Editor с добавленными записями.
- [x] Ссылка на проект и скриншот отправлены ментору.
