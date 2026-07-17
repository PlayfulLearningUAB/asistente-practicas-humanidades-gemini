# Asistente de prácticas — Humanidades y Patrimonio Digital

Chat que ayuda al estudiantado del máster a explorar el vivero de prácticas de este curso y a preseleccionar 3 entidades afines a sus intereses, para comentar después con la coordinadora de prácticas.

## Estructura

- `app/page.tsx` — interfaz de chat.
- `app/api/chat/route.ts` — endpoint que llama a la API de Claude (Anthropic) con el prompt de sistema y los datos de las entidades.
- `lib/system-prompt.ts` — prompt de sistema: rol del asistente, preguntas guiadas, criterio de comparación y formato de salida.
- `data/centros-practicas.json` — base de datos de entidades, generada desde el Excel original con `../scripts/clean-excel.js`. Volver a ejecutar ese script (y copiar el resultado aquí) cuando la lista de entidades se actualice cada curso.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Variables de entorno

Copia `.env.example` a `.env.local` y añade tu clave:

```
ANTHROPIC_API_KEY=sk-ant-...
```

La clave se genera en [console.anthropic.com](https://console.anthropic.com) (Settings → API Keys). El uso del chat tiene un coste por conversación que se factura a la cuenta dueña de la clave — revisar límites de gasto ahí mismo antes de lanzar a todo el máster.

## Despliegue en Vercel

1. Subir este proyecto a un repositorio (GitHub).
2. Importarlo en [vercel.com/new](https://vercel.com/new).
3. En "Environment Variables", añadir `ANTHROPIC_API_KEY` con la clave real.
4. Deploy.
