$replacements = @(
    @{ file="Contactos\RevocarCompartido.cs"; match="await cacheStore.EvictByTagAsync\(`"contactos`", ct\);"; repl="await context.UpsertAgentContactActivityAsync(currentUserId, id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);`r`n            await cacheStore.EvictByTagAsync(`"contactos`", ct);" },
    @{ file="Contactos\ToggleBotActivo.cs"; match="await cacheStore.EvictByTagAsync\(`"contactos`", ct\);"; repl="await context.UpsertAgentContactActivityAsync(agenteId, id, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);`r`n            await cacheStore.EvictByTagAsync(`"contactos`", ct);" },
    @{ file="Intereses\DesvincularPropiedad.cs"; match="// Invalidar caches proactivamente"; repl="await context.UpsertAgentContactActivityAsync(agenteId, contactoId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);`r`n                // Invalidar caches proactivamente" },
    @{ file="Interacciones\ActualizarInteraccion.cs"; match="await cacheStore.EvictByTagAsync\(`"dashboard-data`", ct\);"; repl="if (interaction != null) { await context.UpsertAgentContactActivityAsync(agenteId, interaction.ContactoId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct); }`r`n            await cacheStore.EvictByTagAsync(`"dashboard-data`", ct);" },
    @{ file="Interacciones\EliminarInteraccion.cs"; match="var rowsAffected = await context.Interactions"; repl="var interaccion = await context.Interactions.FindAsync(id);`r`n            var contactoId = interaccion?.ContactoId;`r`n`r`n            var rowsAffected = await context.Interactions" },
    @{ file="Interacciones\EliminarInteraccion.cs"; match="// Invalidar caches proactivamente"; repl="if (contactoId.HasValue) { await context.UpsertAgentContactActivityAsync(agenteId, contactoId.Value, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct); }`r`n            // Invalidar caches proactivamente" },
    @{ file="Propiedades\LimpiarImagenesPropiedad.cs"; match="await context.SaveChangesAsync\(\);"; repl="await context.SaveChangesAsync();`r`n            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), command.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);" },
    @{ file="Propiedades\EliminarImagenesSeleccionadas.cs"; match="await context.SaveChangesAsync\(\);"; repl="await context.SaveChangesAsync();`r`n            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), command.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);" },
    @{ file="Propiedades\EstablecerImagenPrincipal.cs"; match="await context.SaveChangesAsync\(\);"; repl="await context.SaveChangesAsync();`r`n            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), command.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);" },
    @{ file="Propiedades\EliminarTodasLasImagenes.cs"; match="await context.SaveChangesAsync\(\);"; repl="await context.SaveChangesAsync();`r`n            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), command.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), default);" },
    @{ file="Tareas\CompletarTarea.cs"; match="if \(t != null\) \{"; repl="if (t != null) {`r`n                if (t.ContactoId.HasValue) await context.UpsertAgentContactActivityAsync(agenteId, t.ContactoId.Value, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);`r`n                if (t.PropiedadId.HasValue) await context.UpsertAgentPropertyActivityAsync(agenteId, t.PropiedadId.Value, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);" },
    @{ file="SeccionesGaleria\RegistrarSeccion.cs"; match="await context.SaveChangesAsync\(ct\);"; repl="await context.SaveChangesAsync(ct);`r`n            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), command.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);" },
    @{ file="SeccionesGaleria\ActualizarSeccion.cs"; match="await context.SaveChangesAsync\(ct\);"; repl="await context.SaveChangesAsync(ct);`r`n            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), seccion.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);" },
    @{ file="SeccionesGaleria\ReordenarSecciones.cs"; match="await context.SaveChangesAsync\(ct\);"; repl="await context.SaveChangesAsync(ct);`r`n            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), command.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);" },
    @{ file="SeccionesGaleria\EliminarSeccion.cs"; match="await context.SaveChangesAsync\(ct\);"; repl="await context.SaveChangesAsync(ct);`r`n            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), seccion.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);" },
    @{ file="SeccionesGaleria\ActualizarDescripcionMultimedia.cs"; match="await context.SaveChangesAsync\(ct\);"; repl="await context.SaveChangesAsync(ct);`r`n            await context.UpsertAgentPropertyActivityAsync(user.GetRequiredUserId(), seccion.PropiedadId, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), ct);" },
    @{ file="WhatsApp\Services\WhatsAppMessageSender.cs"; match="await db.SaveChangesAsync\(cancellationToken\);"; repl="await db.SaveChangesAsync(cancellationToken);`r`n                    if (agenteId.HasValue) { await db.UpsertAgentContactActivityAsync(agenteId.Value, contactoId.Value, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), cancellationToken); }" },
    @{ file="Facebook\Services\FacebookMessageSender.cs"; match="await db.SaveChangesAsync\(cancellationToken\);"; repl="await db.SaveChangesAsync(cancellationToken);`r`n                    if (agenteId.HasValue) { await db.UpsertAgentContactActivityAsync(agenteId.Value, contactoId.Value, DateTimeOffset.UtcNow.ToOffset(TimeSpan.FromHours(-5)), cancellationToken); }" }
)

foreach ($r in $replacements) {
    if (Test-Path $r.file) {
        $content = Get-Content -Path $r.file -Raw
        if ($content -notmatch "UpsertAgent") {
            $content = $content -replace $r.match, $r.repl
            Set-Content -Path $r.file -Value $content
            Write-Host "Updated $($r.file)"
        } else {
            Write-Host "Skipped $($r.file) (Already injected)"
        }
    } else {
        Write-Host "Error: File not found $($r.file)"
    }
}
