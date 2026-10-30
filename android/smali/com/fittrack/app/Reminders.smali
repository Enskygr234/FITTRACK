.class public Lcom/fittrack/app/Reminders;
.super Landroid/content/BroadcastReceiver;
.source "Reminders.java"

# Hatırlatıcılar: su (09–21 arası 2 saatte bir) ve antrenman günü bildirimi.
# Ayarlar "fittrack_widget" tercihlerinde tutulur (Bridge.setReminders yazar).

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Landroid/content/BroadcastReceiver;-><init>()V
    return-void
.end method

.method private static pi(Landroid/content/Context;Ljava/lang/String;I)Landroid/app/PendingIntent;
    .locals 3
    new-instance v0, Landroid/content/Intent;
    const-class v1, Lcom/fittrack/app/Reminders;
    invoke-direct {v0, p0, v1}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V
    invoke-virtual {v0, p1}, Landroid/content/Intent;->setAction(Ljava/lang/String;)Landroid/content/Intent;
    const v2, 0xc000000
    invoke-static {p0, p2, v0, v2}, Landroid/app/PendingIntent;->getBroadcast(Landroid/content/Context;ILandroid/content/Intent;I)Landroid/app/PendingIntent;
    move-result-object v0
    return-object v0
.end method

# Alarmları ayarla / iptal et
.method public static schedule(Landroid/content/Context;)V
    .locals 12
    # kayıtlar: v1 = AlarmManager, v2 = AlarmManager kopyası (range çağrısı için),
    # v3 = tür, v4-v5 = ilk tetik, v6-v7 = aralık, v8 = PendingIntent
    invoke-static {p0}, Lcom/fittrack/app/FitWidget;->prefs(Landroid/content/Context;)Landroid/content/SharedPreferences;
    move-result-object v0
    const-string v1, "alarm"
    invoke-virtual {p0, v1}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;
    move-result-object v1
    check-cast v1, Landroid/app/AlarmManager;

    # --- su: 30 dk sonra başlayıp 2 saatte bir ---
    const-string v2, "com.fittrack.app.REMIND_WATER"
    const/16 v3, 0xb
    invoke-static {p0, v2, v3}, Lcom/fittrack/app/Reminders;->pi(Landroid/content/Context;Ljava/lang/String;I)Landroid/app/PendingIntent;
    move-result-object v8
    invoke-virtual {v1, v8}, Landroid/app/AlarmManager;->cancel(Landroid/app/PendingIntent;)V
    const-string v3, "remWater"
    const/4 v4, 0x0
    invoke-interface {v0, v3, v4}, Landroid/content/SharedPreferences;->getBoolean(Ljava/lang/String;Z)Z
    move-result v3
    if-eqz v3, :workout
    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J
    move-result-wide v4
    const-wide/32 v6, 0x1b7740
    add-long/2addr v4, v6
    const-wide/32 v6, 0x6ddd00
    move-object v2, v1
    const/4 v3, 0x0
    invoke-virtual/range {v2 .. v8}, Landroid/app/AlarmManager;->setInexactRepeating(IJJLandroid/app/PendingIntent;)V

    # --- antrenman: her gün seçilen saatte (gün kontrolü alıcıda) ---
    :workout
    const-string v2, "com.fittrack.app.REMIND_WORKOUT"
    const/16 v3, 0xc
    invoke-static {p0, v2, v3}, Lcom/fittrack/app/Reminders;->pi(Landroid/content/Context;Ljava/lang/String;I)Landroid/app/PendingIntent;
    move-result-object v8
    invoke-virtual {v1, v8}, Landroid/app/AlarmManager;->cancel(Landroid/app/PendingIntent;)V
    const-string v3, "remWorkout"
    const/4 v4, 0x0
    invoke-interface {v0, v3, v4}, Landroid/content/SharedPreferences;->getBoolean(Ljava/lang/String;Z)Z
    move-result v3
    if-eqz v3, :end

    invoke-static {}, Ljava/util/Calendar;->getInstance()Ljava/util/Calendar;
    move-result-object v9
    const-string v3, "remHour"
    const/16 v4, 0x12
    invoke-interface {v0, v3, v4}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v4
    const/16 v3, 0xb
    invoke-virtual {v9, v3, v4}, Ljava/util/Calendar;->set(II)V
    const-string v3, "remMin"
    const/4 v4, 0x0
    invoke-interface {v0, v3, v4}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v4
    const/16 v3, 0xc
    invoke-virtual {v9, v3, v4}, Ljava/util/Calendar;->set(II)V
    const/16 v3, 0xd
    const/4 v4, 0x0
    invoke-virtual {v9, v3, v4}, Ljava/util/Calendar;->set(II)V
    invoke-virtual {v9}, Ljava/util/Calendar;->getTimeInMillis()J
    move-result-wide v4
    invoke-static {}, Ljava/lang/System;->currentTimeMillis()J
    move-result-wide v10
    cmp-long v3, v4, v10
    if-gtz v3, :future
    const-wide/32 v10, 0x5265c00
    add-long/2addr v4, v10
    :future
    const-wide/32 v6, 0x5265c00
    move-object v2, v1
    const/4 v3, 0x0
    invoke-virtual/range {v2 .. v8}, Landroid/app/AlarmManager;->setInexactRepeating(IJJLandroid/app/PendingIntent;)V
    :end
    return-void
.end method

.method private static notify(Landroid/content/Context;ILjava/lang/String;Ljava/lang/String;)V
    .locals 8
    const-string v0, "notification"
    invoke-virtual {p0, v0}, Landroid/content/Context;->getSystemService(Ljava/lang/String;)Ljava/lang/Object;
    move-result-object v0
    check-cast v0, Landroid/app/NotificationManager;

    sget v1, Landroid/os/Build$VERSION;->SDK_INT:I
    const/16 v2, 0x1a
    if-lt v1, v2, :old_api
    new-instance v3, Landroid/app/NotificationChannel;
    const-string v4, "fittrack"
    const-string v5, "FITTRACK Hatırlatıcılar"
    const/4 v6, 0x3
    invoke-direct {v3, v4, v5, v6}, Landroid/app/NotificationChannel;-><init>(Ljava/lang/String;Ljava/lang/CharSequence;I)V
    invoke-virtual {v0, v3}, Landroid/app/NotificationManager;->createNotificationChannel(Landroid/app/NotificationChannel;)V
    new-instance v3, Landroid/app/Notification$Builder;
    invoke-direct {v3, p0, v4}, Landroid/app/Notification$Builder;-><init>(Landroid/content/Context;Ljava/lang/String;)V
    goto :built
    :old_api
    new-instance v3, Landroid/app/Notification$Builder;
    invoke-direct {v3, p0}, Landroid/app/Notification$Builder;-><init>(Landroid/content/Context;)V
    :built

    # küçük ikon
    invoke-virtual {p0}, Landroid/content/Context;->getResources()Landroid/content/res/Resources;
    move-result-object v4
    const-string v5, "ic_notif"
    const-string v6, "drawable"
    invoke-virtual {p0}, Landroid/content/Context;->getPackageName()Ljava/lang/String;
    move-result-object v7
    invoke-virtual {v4, v5, v6, v7}, Landroid/content/res/Resources;->getIdentifier(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)I
    move-result v4
    if-nez v4, :has_icon
    const v4, 0x108009b
    :has_icon
    invoke-virtual {v3, v4}, Landroid/app/Notification$Builder;->setSmallIcon(I)Landroid/app/Notification$Builder;
    invoke-virtual {v3, p2}, Landroid/app/Notification$Builder;->setContentTitle(Ljava/lang/CharSequence;)Landroid/app/Notification$Builder;
    invoke-virtual {v3, p3}, Landroid/app/Notification$Builder;->setContentText(Ljava/lang/CharSequence;)Landroid/app/Notification$Builder;
    const/4 v4, 0x1
    invoke-virtual {v3, v4}, Landroid/app/Notification$Builder;->setAutoCancel(Z)Landroid/app/Notification$Builder;
    const v4, -0xd2c3
    invoke-virtual {v3, v4}, Landroid/app/Notification$Builder;->setColor(I)Landroid/app/Notification$Builder;

    # dokununca uygulamayı aç
    new-instance v4, Landroid/content/Intent;
    const-class v5, Lcom/fittrack/app/MainActivity;
    invoke-direct {v4, p0, v5}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V
    const/4 v5, 0x0
    const v6, 0xc000000
    invoke-static {p0, v5, v4, v6}, Landroid/app/PendingIntent;->getActivity(Landroid/content/Context;ILandroid/content/Intent;I)Landroid/app/PendingIntent;
    move-result-object v4
    invoke-virtual {v3, v4}, Landroid/app/Notification$Builder;->setContentIntent(Landroid/app/PendingIntent;)Landroid/app/Notification$Builder;

    invoke-virtual {v3}, Landroid/app/Notification$Builder;->build()Landroid/app/Notification;
    move-result-object v3
    :try_start
    invoke-virtual {v0, p1, v3}, Landroid/app/NotificationManager;->notify(ILandroid/app/Notification;)V
    :try_end
    .catch Ljava/lang/Exception; {:try_start .. :try_end} :ignore
    :ignore
    return-void
.end method

.method public onReceive(Landroid/content/Context;Landroid/content/Intent;)V
    .locals 10
    invoke-virtual {p2}, Landroid/content/Intent;->getAction()Ljava/lang/String;
    move-result-object v0
    if-nez v0, :has_action
    return-void
    :has_action

    # yeniden başlatma / güncelleme sonrası alarmları kur
    const-string v1, "android.intent.action.BOOT_COMPLETED"
    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v1
    if-nez v1, :resched
    const-string v1, "android.intent.action.MY_PACKAGE_REPLACED"
    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v1
    if-eqz v1, :not_boot
    :resched
    invoke-static {p1}, Lcom/fittrack/app/Reminders;->schedule(Landroid/content/Context;)V
    return-void
    :not_boot

    invoke-static {p1}, Lcom/fittrack/app/FitWidget;->prefs(Landroid/content/Context;)Landroid/content/SharedPreferences;
    move-result-object v1
    invoke-static {}, Ljava/util/Calendar;->getInstance()Ljava/util/Calendar;
    move-result-object v2
    invoke-static {}, Lcom/fittrack/app/FitWidget;->today()Ljava/lang/String;
    move-result-object v3
    const-string v4, "date"
    const/4 v5, 0x0
    invoke-interface {v1, v4, v5}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v4
    invoke-virtual {v3, v4}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v3

    const-string v4, "com.fittrack.app.REMIND_WATER"
    invoke-virtual {v4, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v4
    if-eqz v4, :check_workout

    # --- su: yalnızca 09:00–21:59 arası ---
    const/16 v4, 0xb
    invoke-virtual {v2, v4}, Ljava/util/Calendar;->get(I)I
    move-result v4
    const/16 v5, 0x9
    if-ge v4, v5, :after9
    return-void
    :after9
    const/16 v5, 0x15
    if-le v4, v5, :in_hours
    return-void
    :in_hours
    const/4 v5, 0x0
    if-eqz v3, :w_read
    const-string v6, "water"
    invoke-interface {v1, v6, v5}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v5
    :w_read
    const-string v6, "waterGoal"
    const/16 v7, 0xbb8
    invoke-interface {v1, v6, v7}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v6
    if-lt v5, v6, :need_water
    return-void
    :need_water
    sub-int v7, v6, v5
    new-instance v8, Ljava/lang/StringBuilder;
    invoke-direct {v8}, Ljava/lang/StringBuilder;-><init>()V
    const-string v9, "Bugün "
    invoke-virtual {v8, v9}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v8, v5}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string v9, " ml içtin, hedefe "
    invoke-virtual {v8, v9}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v8, v7}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string v9, " ml kaldı. Bir bardak su iç!"
    invoke-virtual {v8, v9}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v8}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v8
    const/16 v4, 0x65
    const-string v9, "Su içme zamanı 💧"
    invoke-static {p1, v4, v9, v8}, Lcom/fittrack/app/Reminders;->notify(Landroid/content/Context;ILjava/lang/String;Ljava/lang/String;)V
    return-void

    :check_workout
    const-string v4, "com.fittrack.app.REMIND_WORKOUT"
    invoke-virtual {v4, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v4
    if-nez v4, :workout
    return-void
    :workout
    # Pazartesi=0 indeksli gün maskesi ("1010100")
    const/4 v4, 0x7
    invoke-virtual {v2, v4}, Ljava/util/Calendar;->get(I)I
    move-result v4
    add-int/lit8 v4, v4, 0x5
    rem-int/lit8 v4, v4, 0x7
    const-string v5, "remMask"
    const-string v6, "0000000"
    invoke-interface {v1, v5, v6}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v5
    invoke-virtual {v5}, Ljava/lang/String;->length()I
    move-result v6
    if-lt v4, v6, :idx_ok
    return-void
    :idx_ok
    invoke-virtual {v5, v4}, Ljava/lang/String;->charAt(I)C
    move-result v6
    const/16 v7, 0x31
    if-eq v6, v7, :is_day
    return-void
    :is_day
    const-string v8, "Bugün antrenman günü! Hazır mısın? 💪"
    if-eqz v3, :w_text
    const-string v5, "workout"
    invoke-interface {v1, v5, v8}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v8
    :w_text
    const/16 v4, 0x66
    const-string v9, "Antrenman zamanı 💪"
    invoke-static {p1, v4, v9, v8}, Lcom/fittrack/app/Reminders;->notify(Landroid/content/Context;ILjava/lang/String;Ljava/lang/String;)V
    return-void
.end method
