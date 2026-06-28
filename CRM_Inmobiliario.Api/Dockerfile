# =============================================================================
# STAGE 1: BUILD
# SDK completo para compilar y publicar en modo Release
# =============================================================================
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar el .csproj primero para aprovechar el caché de capas de Docker.
# Si los paquetes no cambian, esta capa no se reconstruye.
COPY CRM_Inmobiliario.Api/CRM_Inmobiliario.Api.csproj CRM_Inmobiliario.Api/

RUN dotnet restore "CRM_Inmobiliario.Api/CRM_Inmobiliario.Api.csproj"

# Copiar el resto del código fuente
COPY CRM_Inmobiliario.Api/ CRM_Inmobiliario.Api/

WORKDIR /src/CRM_Inmobiliario.Api

# Publicar en modo Release, para la arquitectura linux-x64, sin binarios nativos del SDK
RUN dotnet publish "CRM_Inmobiliario.Api.csproj" \
    -c Release \
    -r linux-x64 \
    --self-contained false \
    -o /app/publish

# =============================================================================
# STAGE 2: RUNTIME (imagen final, minimal)
# Solo el ASP.NET runtime, sin el SDK completo. Imagen más pequeña y segura.
# =============================================================================
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Instalar dependencias nativas requeridas por QuestPDF (libfontconfig, libfreetype)
# y por libphonenumber. Son necesarias en el runtime de Linux.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libfontconfig1 \
    libfreetype6 \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Copiar artefactos publicados desde la etapa de build
COPY --from=build /app/publish .

# Railway asigna el puerto dinámicamente vía la variable $PORT.
# ASP.NET Core lee ASPNETCORE_URLS para saber en qué URL escuchar.
# El CMD de abajo configura esto correctamente en el arranque del contenedor.
# Exponemos 8080 como documentación (Railway lo ignora y usa $PORT).
EXPOSE 8080

# Usar un script de entrada para configurar la URL dinámica de Railway en tiempo de ejecución.
# ASPNETCORE_URLS debe resolverse con el valor real de $PORT al arrancar, no en build time.
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} exec dotnet CRM_Inmobiliario.Api.dll"]
