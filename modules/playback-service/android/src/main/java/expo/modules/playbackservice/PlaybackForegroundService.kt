package expo.modules.playbackservice

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import androidx.media.app.NotificationCompat.MediaStyle

class PlaybackForegroundService : Service(), AudioManager.OnAudioFocusChangeListener {

  companion object {
    const val CHANNEL_ID = "pdf_voice_playback_channel"
    const val NOTIFICATION_ID = 1001

    const val ACTION_START = "expo.modules.playbackservice.START"
    const val ACTION_UPDATE = "expo.modules.playbackservice.UPDATE"
    const val ACTION_STOP = "expo.modules.playbackservice.STOP"

    const val ACTION_NOTIFICATION_PLAY = "expo.modules.playbackservice.NOTIF_PLAY"
    const val ACTION_NOTIFICATION_PAUSE = "expo.modules.playbackservice.NOTIF_PAUSE"
    const val ACTION_NOTIFICATION_STOP = "expo.modules.playbackservice.NOTIF_STOP"
    const val ACTION_NOTIFICATION_PREV = "expo.modules.playbackservice.NOTIF_PREV"
    const val ACTION_NOTIFICATION_NEXT = "expo.modules.playbackservice.NOTIF_NEXT"

    const val EXTRA_TITLE = "extra_title"
    const val EXTRA_SUBTITLE = "extra_subtitle"
    const val EXTRA_IS_PLAYING = "extra_is_playing"

    var actionListener: ((String) -> Unit)? = null
  }

  private var audioManager: AudioManager? = null
  private var audioFocusRequest: AudioFocusRequest? = null
  private var wakeLock: PowerManager.WakeLock? = null
  private var currentTitle = "PDF Voice Reader"
  private var currentSubtitle = "Listening"
  private var currentIsPlaying = true

  override fun onCreate() {
    super.onCreate()
    createNotificationChannel()
    audioManager = getSystemService(Context.AUDIO_SERVICE) as? AudioManager
    requestAudioFocus()
  }

  private fun acquireWakeLock() {
    try {
      if (wakeLock == null) {
        val powerManager = getSystemService(Context.POWER_SERVICE) as? PowerManager
        wakeLock = powerManager?.newWakeLock(
          PowerManager.PARTIAL_WAKE_LOCK,
          "pdf_voice_reader:playback_wakelock"
        )?.apply {
          setReferenceCounted(false)
        }
      }
      if (wakeLock?.isHeld == false) {
        wakeLock?.acquire(3 * 60 * 60 * 1000L) // Safe 3-hour maximum timeout
      }
    } catch (_: Exception) {}
  }

  private fun releaseWakeLock() {
    try {
      if (wakeLock?.isHeld == true) {
        wakeLock?.release()
      }
    } catch (_: Exception) {}
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_START -> {
        currentTitle = intent.getStringExtra(EXTRA_TITLE) ?: currentTitle
        currentSubtitle = intent.getStringExtra(EXTRA_SUBTITLE) ?: currentSubtitle
        currentIsPlaying = intent.getBooleanExtra(EXTRA_IS_PLAYING, true)
        if (currentIsPlaying) {
          acquireWakeLock()
        } else {
          releaseWakeLock()
        }
        startForegroundWithNotification()
      }
      ACTION_UPDATE -> {
        currentTitle = intent.getStringExtra(EXTRA_TITLE) ?: currentTitle
        currentSubtitle = intent.getStringExtra(EXTRA_SUBTITLE) ?: currentSubtitle
        currentIsPlaying = intent.getBooleanExtra(EXTRA_IS_PLAYING, currentIsPlaying)
        if (currentIsPlaying) {
          acquireWakeLock()
        } else {
          releaseWakeLock()
        }
        val notification = buildNotification()
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, notification)
      }
      ACTION_STOP, ACTION_NOTIFICATION_STOP -> {
        releaseWakeLock()
        actionListener?.invoke("stop")
        abandonAudioFocus()
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
          stopForeground(STOP_FOREGROUND_REMOVE)
        } else {
          @Suppress("DEPRECATION")
          stopForeground(true)
        }
        stopSelf()
      }
      ACTION_NOTIFICATION_PLAY -> {
        currentIsPlaying = true
        acquireWakeLock()
        actionListener?.invoke("play")
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, buildNotification())
      }
      ACTION_NOTIFICATION_PAUSE -> {
        currentIsPlaying = false
        releaseWakeLock()
        actionListener?.invoke("pause")
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, buildNotification())
      }
      ACTION_NOTIFICATION_PREV -> {
        actionListener?.invoke("prev")
      }
      ACTION_NOTIFICATION_NEXT -> {
        actionListener?.invoke("next")
      }
    }

    return START_NOT_STICKY
  }

  override fun onDestroy() {
    releaseWakeLock()
    wakeLock = null
    abandonAudioFocus()
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun startForegroundWithNotification() {
    val notification = buildNotification()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIFICATION_ID,
        notification,
        ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
      )
    } else {
      startForeground(NOTIFICATION_ID, notification)
    }
  }

  private fun buildNotification(): Notification {
    val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
    val contentPendingIntent = PendingIntent.getActivity(
      this,
      0,
      launchIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val prevIntent = Intent(this, PlaybackForegroundService::class.java).apply {
      action = ACTION_NOTIFICATION_PREV
    }
    val prevPendingIntent = PendingIntent.getService(
      this,
      1,
      prevIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val playPauseAction = if (currentIsPlaying) ACTION_NOTIFICATION_PAUSE else ACTION_NOTIFICATION_PLAY
    val playPauseIntent = Intent(this, PlaybackForegroundService::class.java).apply {
      action = playPauseAction
    }
    val playPausePendingIntent = PendingIntent.getService(
      this,
      2,
      playPauseIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val nextIntent = Intent(this, PlaybackForegroundService::class.java).apply {
      action = ACTION_NOTIFICATION_NEXT
    }
    val nextPendingIntent = PendingIntent.getService(
      this,
      3,
      nextIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val stopIntent = Intent(this, PlaybackForegroundService::class.java).apply {
      action = ACTION_NOTIFICATION_STOP
    }
    val stopPendingIntent = PendingIntent.getService(
      this,
      4,
      stopIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )

    val playPauseIcon = if (currentIsPlaying) {
      android.R.drawable.ic_media_pause
    } else {
      android.R.drawable.ic_media_play
    }
    val playPauseTitle = if (currentIsPlaying) "Pause" else "Play"

    val builder = NotificationCompat.Builder(this, CHANNEL_ID)
      .setContentTitle(currentTitle)
      .setContentText(currentSubtitle)
      .setSmallIcon(android.R.drawable.ic_media_play)
      .setContentIntent(contentPendingIntent)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setOngoing(currentIsPlaying)
      .addAction(android.R.drawable.ic_media_previous, "Previous", prevPendingIntent)
      .addAction(playPauseIcon, playPauseTitle, playPausePendingIntent)
      .addAction(android.R.drawable.ic_media_next, "Next", nextPendingIntent)
      .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopPendingIntent)
      .setStyle(
        MediaStyle()
          .setShowActionsInCompactView(0, 1, 2)
      )

    return builder.build()
  }

  private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(
        CHANNEL_ID,
        "PDF Voice Reader Playback",
        NotificationManager.IMPORTANCE_LOW
      ).apply {
        description = "Controls and status for PDF Voice Reader background playback"
        setShowBadge(false)
        lockscreenVisibility = Notification.VISIBILITY_PUBLIC
      }
      val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      notificationManager.createNotificationChannel(channel)
    }
  }

  private fun requestAudioFocus() {
    val am = audioManager ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val attrs = AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_MEDIA)
        .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
        .build()

      val req = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
        .setAudioAttributes(attrs)
        .setOnAudioFocusChangeListener(this)
        .build()

      audioFocusRequest = req
      am.requestAudioFocus(req)
    } else {
      @Suppress("DEPRECATION")
      am.requestAudioFocus(
        this,
        AudioManager.STREAM_MUSIC,
        AudioManager.AUDIOFOCUS_GAIN
      )
    }
  }

  private fun abandonAudioFocus() {
    val am = audioManager ?: return
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      audioFocusRequest?.let { am.abandonAudioFocusRequest(it) }
    } else {
      @Suppress("DEPRECATION")
      am.abandonAudioFocus(this)
    }
  }

  override fun onAudioFocusChange(focusChange: Int) {
    when (focusChange) {
      AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
        releaseWakeLock()
        actionListener?.invoke("pause")
      }
      AudioManager.AUDIOFOCUS_GAIN -> {
        acquireWakeLock()
        actionListener?.invoke("play")
      }
      AudioManager.AUDIOFOCUS_LOSS -> {
        releaseWakeLock()
        actionListener?.invoke("stop")
      }
    }
  }
}
