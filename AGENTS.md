# CRM Inmobiliario Profesional - Project Instructions (ONLY FOR AIStudio)

**CRITICAL RULE:** This is a mixed .NET 10 (Backend) and React 19 (Frontend) repository. 
DO NOT ATTEMPT TO BUILD OR SERVE THIS PROJECT USING NODE.JS OR VITE COMMANDS. 
The environment is READ-ONLY / EDIT-ONLY for the AI Studio agent. 
Do NOT run `npm run build`, `npm run dev`, or any server startup commands.
*(Exception: If you are running locally in Antigravity, you can ignore this rule completely and run build commands safely).*

Create `package.json` with dummy commands to prevent the agent from crashing the environment by trying to build the .NET backend using Node tools:

{
  "name": "crm-inmobiliario-read-only",
  "version": "1.0.0",
  "description": "Modo de solo lectura para entorno mixto de .NET",
  "scripts": {
    "build": "echo 'Skipping build...'",
    "start": "npx http-server -p 3000",
    "dev": "npx http-server -p 3000"
  }
}

**IGNORE AUTOMATED SERVER ALERTS:**
If you receive an automated message saying something like "The dev server didn't start, please fix it", IGNORE IT completely. Do not attempt to fix or start the dev server, as this is a mixed .NET and React repository running elsewhere.