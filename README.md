## Backend integration

Этот фронт уже интегрируется с backend через `POST /analyze-image`.
Браузер отправляет файл в Next route handler [`app/api/analyze-image/route.ts`](/home/erasyl/Documents/hackaton_front/hack/app/api/analyze-image/route.ts), а тот проксирует multipart-запрос в ваш FastAPI backend.

### 1. Укажите backend URL

Создайте `.env.local`:

```bash
cp .env.example .env.local
```

По умолчанию фронт ожидает backend на `http://127.0.0.1:8000`.
Если FastAPI запущен на другом хосте или через туннель, измените:

```env
BACKEND_API_URL=http://127.0.0.1:8000
```

### 2. Запустите backend

Из папки backend, например:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

На backend должен быть доступен endpoint:

```text
POST /analyze-image
```

Он принимает `multipart/form-data` с полями:

```text
file
lat
lng
```

### 3. Запустите frontend

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.

### 4. Что уже поддержано

- Успешный ответ backend со `status: "success"` добавляет инцидент на карту.
- Ответ со `status: "rejected"` показывает результат модерации, но не создаёт инцидент.
- Весь клиентский код ходит через same-origin `/api/analyze-image`, поэтому отдельный CORS на фронте не нужен.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
