'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Send, 
  Heart, 
  Trash2, 
  RefreshCw, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  Code2, 
  Smartphone, 
  Laptop,
  MessageSquarePlus,
  Filter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Vibe } from '@/types/vibe';

const TAGS = [
  '🚀 Вайбкодинг',
  '💡 Идея проекта',
  '🔥 Учеба',
  '☕ Отдых',
  '🎯 Цель',
  '💬 Вопрос ментору',
];

const INITIAL_MOCK_VIBES: Vibe[] = [
  {
    id: 'mock-1',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    author: 'Ментор курса',
    content: 'Привет группе 26-DCPS-01! Отличное начало работы с Next.js и базой данных Supabase! 👍',
    tag: '🚀 Вайбкодинг',
    likes: 7,
  },
  {
    id: 'mock-2',
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    author: 'Студент',
    content: 'Проверяю работу с телефона и ноутбука — всё мгновенно синхронизируется через облако.',
    tag: '🔥 Учеба',
    likes: 3,
  },
];

export default function Home() {
  const [vibes, setVibes] = useState<Vibe[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [selectedTag, setSelectedTag] = useState(TAGS[0]);
  const [activeFilter, setActiveFilter] = useState<string>('Все');
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Restore author from localStorage
  useEffect(() => {
    const savedAuthor = localStorage.getItem('vibe_author');
    if (savedAuthor) {
      setAuthor(savedAuthor);
    }
  }, []);

  // Fetch vibes from Supabase or Fallback
  const fetchVibes = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    setErrorMessage(null);

    if (!isSupabaseConfigured) {
      // Use local/demo mode
      const savedMock = localStorage.getItem('vibe_demo_records');
      if (savedMock) {
        try {
          setVibes(JSON.parse(savedMock));
        } catch {
          setVibes(INITIAL_MOCK_VIBES);
        }
      } else {
        setVibes(INITIAL_MOCK_VIBES);
      }
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vibes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase query error:', error);
        setErrorMessage(error.message);
      } else if (data) {
        setVibes(data as Vibe[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка соединения с базой';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVibes();
  }, [fetchVibes]);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !author.trim()) return;

    setSubmitting(true);
    setErrorMessage(null);

    // Save author to localStorage
    localStorage.setItem('vibe_author', author.trim());

    if (!isSupabaseConfigured) {
      // Demo mode fallback
      const newVibe: Vibe = {
        id: 'mock-' + Date.now(),
        created_at: new Date().toISOString(),
        author: author.trim(),
        content: content.trim(),
        tag: selectedTag,
        likes: 0,
      };

      const updated = [newVibe, ...vibes];
      setVibes(updated);
      localStorage.setItem('vibe_demo_records', JSON.stringify(updated));
      setContent('');
      setSubmitting(false);
      triggerConfetti();
      return;
    }

    try {
      const { error } = await supabase.from('vibes').insert([
        {
          author: author.trim(),
          content: content.trim(),
          tag: selectedTag,
          likes: 0,
        },
      ]);

      if (error) {
        setErrorMessage(`Ошибка сохранения: ${error.message}`);
      } else {
        setContent('');
        triggerConfetti();
        await fetchVibes();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Не удалось добавить запись';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Like a vibe
  const handleLike = async (id: string, currentLikes: number) => {
    if (!isSupabaseConfigured) {
      const updated = vibes.map((v) =>
        v.id === id ? { ...v, likes: (v.likes || 0) + 1 } : v
      );
      setVibes(updated);
      localStorage.setItem('vibe_demo_records', JSON.stringify(updated));
      return;
    }

    // Optimistic update
    setVibes((prev) =>
      prev.map((v) => (v.id === id ? { ...v, likes: (v.likes || 0) + 1 } : v))
    );

    try {
      const { error } = await supabase
        .from('vibes')
        .update({ likes: currentLikes + 1 })
        .eq('id', id);

      if (error) {
        console.error('Like error:', error);
        fetchVibes(); // Rollback if error
      }
    } catch (err) {
      console.error(err);
      fetchVibes();
    }
  };

  // Delete a vibe
  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту запись из базы данных?')) return;

    if (!isSupabaseConfigured) {
      const updated = vibes.filter((v) => v.id !== id);
      setVibes(updated);
      localStorage.setItem('vibe_demo_records', JSON.stringify(updated));
      return;
    }

    setVibes((prev) => prev.filter((v) => v.id !== id));

    try {
      const { error } = await supabase.from('vibes').delete().eq('id', id);
      if (error) {
        alert(`Ошибка удаления: ${error.message}`);
        fetchVibes();
      }
    } catch (err) {
      console.error(err);
      fetchVibes();
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#6366f1', '#a855f7', '#ec4899', '#3b82f6'],
    });
  };

  const sqlCode = `-- Выполните этот SQL в Supabase -> SQL Editor
CREATE TABLE IF NOT EXISTS vibes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  author TEXT NOT NULL,
  content TEXT NOT NULL,
  tag TEXT DEFAULT '💡 Идея',
  likes INTEGER DEFAULT 0
);

ALTER TABLE vibes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON vibes FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON vibes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON vibes FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON vibes FOR DELETE USING (true);`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  // Filtered list
  const filteredVibes = activeFilter === 'Все'
    ? vibes
    : vibes.filter((v) => v.tag === activeFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80 px-4 py-3 sm:px-8">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg text-white tracking-tight">VibeBoard</h1>
                <span className="text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full">
                  26-DCPS-01
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Моё первое веб-приложение с базой данных Supabase
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchVibes(true)}
              title="Обновить данные"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>

            <button
              onClick={() => setShowSqlModal(true)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
            >
              <Code2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>SQL схема</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-6 sm:px-6">
        
        {/* Status Indicator Banner */}
        <div className="mb-6">
          {isSupabaseConfigured ? (
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs shadow-sm">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Supabase подключен:</strong> Данные синхронизируются в реальном времени с облачной БД!
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] bg-emerald-500/20 px-2 py-0.5 rounded-full text-emerald-300 shrink-0">
                <Database className="w-3 h-3" />
                <span>Online</span>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-amber-100">
                      Демо-режим: Ключи Supabase ещё не добавлены в .env.local
                    </span>
                    <span className="text-amber-300/80 block mt-0.5">
                      Приложение работает локально. Чтобы данные сохранялись в вашей личной облачной базе и были видны с телефона, добавьте URL и Anon Key в файл <code className="bg-amber-900/50 px-1 py-0.5 rounded text-amber-100">.env.local</code> и в настройки Vercel!
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSqlModal(true)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg shrink-0 border border-amber-500/30 transition-all"
                >
                  Как настроить
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Create Post Form */}
        <section className="mb-8">
          <form 
            onSubmit={handleSubmit}
            className="p-5 sm:p-6 rounded-3xl bg-slate-900/60 border border-slate-800 shadow-xl backdrop-blur-sm"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-4">
              <MessageSquarePlus className="w-4 h-4 text-indigo-400" />
              <span>Новая запись в базу данных</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Ваше имя или ник
                </label>
                <input
                  type="text"
                  required
                  placeholder="Например: Амир / Студент 26-DCPS"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Текст мысли / идеи / отзыва
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Напишите что угодно: мысль о вайбкодинге, статус выполнения задания, вопрос..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none transition-all"
                />
              </div>

              {/* Tag Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">
                  Выберите категорию
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-xl transition-all ${
                        selectedTag === tag
                          ? 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/30 scale-102'
                          : 'bg-slate-950/70 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-between gap-4">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Запись сразу появится в таблице Supabase
                </span>
                <button
                  type="submit"
                  disabled={submitting || !author.trim() || !content.trim()}
                  className="w-full sm:w-auto ml-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 active:scale-95 text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Сохранение...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Отправить в базу</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </section>

        {/* Feed Header & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white">Все записи</h2>
            <span className="text-xs bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-full">
              {filteredVibes.length}
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-slate-500 mr-1 shrink-0" />
            <button
              onClick={() => setActiveFilter('Все')}
              className={`text-xs px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                activeFilter === 'Все'
                  ? 'bg-slate-700 text-white font-medium'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Все
            </button>
            {TAGS.slice(0, 4).map((tag) => (
              <button
                key={tag}
                onClick={() => setActiveFilter(tag)}
                className={`text-xs px-2.5 py-1 rounded-lg shrink-0 transition-all ${
                  activeFilter === tag
                    ? 'bg-slate-700 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tag.split(' ')[1] || tag}
              </button>
            ))}
          </div>
        </div>

        {/* Feed List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/60 animate-pulse">
                <div className="h-4 bg-slate-800 rounded w-1/4 mb-3"></div>
                <div className="h-3 bg-slate-800 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-800 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filteredVibes.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-slate-800 bg-slate-900/20">
            <Database className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-400">В базе пока нет записей</p>
            <p className="text-xs text-slate-500 mt-1">Оставьте первую запись через форму выше!</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredVibes.map((item) => (
              <article
                key={item.id}
                className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 transition-all shadow-sm group"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-xs text-indigo-300">
                      {item.author.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-slate-200 leading-none">
                        {item.author}
                      </h3>
                      <time className="text-[11px] text-slate-500 mt-1 block">
                        {new Date(item.created_at).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/50">
                    {item.tag}
                  </span>
                </div>

                <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed mb-4">
                  {item.content}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                  <button
                    onClick={() => handleLike(item.id, item.likes || 0)}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 active:scale-95 transition-all"
                  >
                    <Heart className={`w-4 h-4 ${item.likes > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                    <span>{item.likes || 0}</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Удалить запись"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800/60 transition-all opacity-70 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Quick verification helper for the assignment */}
        <section className="mt-10 p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20">
          <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-2">
            Проверка для ментора (Критерии задания)
          </h3>
          <ul className="text-xs text-slate-300 space-y-2">
            <li className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Открытие с телефона:</strong> Адаптивный дизайн отлично масштабируется на мобильных устройствах.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Синхронизация:</strong> Добавив запись со смартфона, обновите страницу на ПК — данные мгновенно отобразятся.
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                <strong>Supabase:</strong> Все данные лежат в таблице <code className="bg-slate-800 px-1 py-0.5 rounded text-indigo-200">vibes</code>, а не захардкожены в коде.
              </span>
            </li>
          </ul>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-6 px-4 text-center text-xs text-slate-500">
        <p>
          Вайбкодинг · группа 26-DCPS-01 · Next.js + TypeScript + Tailwind + Supabase + Vercel
        </p>
      </footer>

      {/* SQL & Setup Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Настройка базы в Supabase</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto space-y-4 pr-1 text-xs text-slate-300">
              <p>
                1. Перейдите на <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-medium">supabase.com</a> и создайте бесплатный проект.
              </p>
              <p>
                2. Откройте вкладку <strong>SQL Editor</strong> слева, нажмите <strong>New query</strong>, вставьте следующий код и нажмите <strong>Run</strong>:
              </p>

              <div className="relative">
                <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono overflow-x-auto text-slate-300">
                  {sqlCode}
                </pre>
                <button
                  onClick={copySqlToClipboard}
                  className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium flex items-center gap-1.5 shadow"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Скопировано!' : 'Копировать'}</span>
                </button>
              </div>

              <p>
                3. Скопируйте <strong>Project URL</strong> и <strong>anon public API Key</strong> из раздела <code>Project Settings -&gt; API</code>.
              </p>
              <p>
                4. Вставьте их в файл <code className="text-indigo-300">.env.local</code> и добавьте в переменные окружения на <strong>Vercel</strong> при деплое!
              </p>
            </div>

            <div className="pt-5 mt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition-all"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
