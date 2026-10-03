package expo.modules.playbackservice

import android.content.Context
import android.content.Intent
import android.os.Build
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlaybackServiceModule : Module() {

  private val context: Context
    get() = appContext.reactContext ?: throw CodedException("Context is not available")

  override fun definition() = ModuleDefinition {
    Name("PlaybackService")

    Events("onPlaybackAction")

    OnCreate {
      PlaybackForegroundService.actionListener = { action ->
        sendEvent("onPlaybackAction", mapOf("action" to action))
      }
    }

    OnDestroy {
      PlaybackForegroundService.actionListener = null
    }

    AsyncFunction("startService") { title: String, subtitle: String, isPlaying: Boolean ->
      val intent = Intent(context, PlaybackForegroundService::class.java).apply {
        action = PlaybackForegroundService.ACTION_START
        putExtra(PlaybackForegroundService.EXTRA_TITLE, title)
        putExtra(PlaybackForegroundService.EXTRA_SUBTITLE, subtitle)
        putExtra(PlaybackForegroundService.EXTRA_IS_PLAYING, isPlaying)
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        context.startForegroundService(intent)
      } else {
        context.startService(intent)
      }
      true
    }

    AsyncFunction("updateNotification") { title: String, subtitle: String, isPlaying: Boolean ->
      val intent = Intent(context, PlaybackForegroundService::class.java).apply {
        action = PlaybackForegroundService.ACTION_UPDATE
        putExtra(PlaybackForegroundService.EXTRA_TITLE, title)
        putExtra(PlaybackForegroundService.EXTRA_SUBTITLE, subtitle)
        putExtra(PlaybackForegroundService.EXTRA_IS_PLAYING, isPlaying)
      }
      context.startService(intent)
      true
    }

    AsyncFunction("stopService") {
      val intent = Intent(context, PlaybackForegroundService::class.java).apply {
        action = PlaybackForegroundService.ACTION_STOP
      }
      context.startService(intent)
      true
    }
  }
}
