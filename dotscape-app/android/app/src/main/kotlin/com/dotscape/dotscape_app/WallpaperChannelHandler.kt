package com.dotscape.dotscape_app

import android.app.WallpaperManager
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.util.concurrent.Executors

/**
 * Native wallpaper operations. Heavy work runs off the main thread;
 * results are always delivered back on the main thread.
 */
class WallpaperChannelHandler(private val context: Context) : MethodChannel.MethodCallHandler {
    private val executor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "setWallpaper" -> runAsync(result) {
                setWallpaper(call.requireString("path"), call.argument<String>("target") ?: "both")
            }
            "saveToGallery" -> runAsync(result) {
                saveToGallery(call.requireString("path"), call.requireString("displayName"))
            }
            "shareText" -> {
                shareText(call.requireString("text"))
                result.success(null)
            }
            else -> result.notImplemented()
        }
    }

    private fun runAsync(result: MethodChannel.Result, block: () -> Unit) {
        executor.execute {
            try {
                block()
                mainHandler.post { result.success(null) }
            } catch (e: Exception) {
                mainHandler.post { result.error("WALLPAPER_ERROR", e.message, null) }
            }
        }
    }

    private fun setWallpaper(path: String, target: String) {
        val flags = when (target) {
            "home" -> WallpaperManager.FLAG_SYSTEM
            "lock" -> WallpaperManager.FLAG_LOCK
            else -> WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
        }
        File(path).inputStream().use { stream ->
            WallpaperManager.getInstance(context).setStream(stream, null, true, flags)
        }
    }

    private fun saveToGallery(path: String, displayName: String) {
        val resolver = context.contentResolver
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, displayName)
            put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg")
            put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/DOTSCAPE")
            put(MediaStore.Images.Media.IS_PENDING, 1)
        }
        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values)
            ?: throw IllegalStateException("Could not create media entry")
        try {
            val output = resolver.openOutputStream(uri) ?: throw IllegalStateException("Could not open output stream")
            output.use { out -> File(path).inputStream().use { it.copyTo(out) } }
            values.clear()
            values.put(MediaStore.Images.Media.IS_PENDING, 0)
            resolver.update(uri, values, null, null)
        } catch (e: Exception) {
            resolver.delete(uri, null, null)
            throw e
        }
    }

    private fun shareText(text: String) {
        val send = Intent(Intent.ACTION_SEND).apply {
            type = "text/plain"
            putExtra(Intent.EXTRA_TEXT, text)
        }
        context.startActivity(Intent.createChooser(send, null).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
    }
}

private fun MethodCall.requireString(name: String): String =
    argument<String>(name) ?: throw IllegalArgumentException("Missing argument: $name")
