.class public Lcom/fittrack/app/FitWidget;
.super Landroid/appwidget/AppWidgetProvider;
.source "FitWidget.java"

# FITTRACK ana ekran widget'ı: günlük su / protein / kalori özeti ve +250 ml su butonu.

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Landroid/appwidget/AppWidgetProvider;-><init>()V
    return-void
.end method

.method public static prefs(Landroid/content/Context;)Landroid/content/SharedPreferences;
    .locals 2
    const-string v0, "fittrack_widget"
    const/4 v1, 0x0
    invoke-virtual {p0, v0, v1}, Landroid/content/Context;->getSharedPreferences(Ljava/lang/String;I)Landroid/content/SharedPreferences;
    move-result-object v0
    return-object v0
.end method

.method public static today()Ljava/lang/String;
    .locals 3
    new-instance v0, Ljava/text/SimpleDateFormat;
    const-string v1, "yyyy-MM-dd"
    sget-object v2, Ljava/util/Locale;->US:Ljava/util/Locale;
    invoke-direct {v0, v1, v2}, Ljava/text/SimpleDateFormat;-><init>(Ljava/lang/String;Ljava/util/Locale;)V
    new-instance v1, Ljava/util/Date;
    invoke-direct {v1}, Ljava/util/Date;-><init>()V
    invoke-virtual {v0, v1}, Ljava/text/DateFormat;->format(Ljava/util/Date;)Ljava/lang/String;
    move-result-object v0
    return-object v0
.end method

.method private static idOf(Landroid/content/Context;Ljava/lang/String;)I
    .locals 3
    invoke-virtual {p0}, Landroid/content/Context;->getResources()Landroid/content/res/Resources;
    move-result-object v0
    const-string v1, "id"
    invoke-virtual {p0}, Landroid/content/Context;->getPackageName()Ljava/lang/String;
    move-result-object v2
    invoke-virtual {v0, p1, v1, v2}, Landroid/content/res/Resources;->getIdentifier(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)I
    move-result v0
    return v0
.end method

.method private static setText(Landroid/content/Context;Landroid/widget/RemoteViews;Ljava/lang/String;Ljava/lang/CharSequence;)V
    .locals 1
    invoke-static {p0, p2}, Lcom/fittrack/app/FitWidget;->idOf(Landroid/content/Context;Ljava/lang/String;)I
    move-result v0
    if-eqz v0, :skip
    invoke-virtual {p1, v0, p3}, Landroid/widget/RemoteViews;->setTextViewText(ILjava/lang/CharSequence;)V
    :skip
    return-void
.end method

.method private static setBar(Landroid/content/Context;Landroid/widget/RemoteViews;Ljava/lang/String;I)V
    .locals 3
    invoke-static {p0, p2}, Lcom/fittrack/app/FitWidget;->idOf(Landroid/content/Context;Ljava/lang/String;)I
    move-result v0
    if-eqz v0, :skip
    const/16 v1, 0x64
    if-le p3, v1, :ok
    move p3, v1
    :ok
    if-gez p3, :ok2
    const/4 p3, 0x0
    :ok2
    const/4 v2, 0x0
    invoke-virtual {p1, v0, v1, p3, v2}, Landroid/widget/RemoteViews;->setProgressBar(IIIZ)V
    :skip
    return-void
.end method

# Widget'ı SharedPreferences'taki son özete göre yeniden çiz
.method public static refresh(Landroid/content/Context;)V
    .locals 11

    invoke-static {p0}, Lcom/fittrack/app/FitWidget;->prefs(Landroid/content/Context;)Landroid/content/SharedPreferences;
    move-result-object v0
    invoke-virtual {p0}, Landroid/content/Context;->getPackageName()Ljava/lang/String;
    move-result-object v1

    # düzen
    invoke-virtual {p0}, Landroid/content/Context;->getResources()Landroid/content/res/Resources;
    move-result-object v2
    const-string v3, "widget"
    const-string v4, "layout"
    invoke-virtual {v2, v3, v4, v1}, Landroid/content/res/Resources;->getIdentifier(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)I
    move-result v3
    if-nez v3, :has_layout
    return-void
    :has_layout
    new-instance v5, Landroid/widget/RemoteViews;
    invoke-direct {v5, v1, v3}, Landroid/widget/RemoteViews;-><init>(Ljava/lang/String;I)V

    # bugün mü? (v9 = 1 ise kayıt bugüne ait)
    invoke-static {}, Lcom/fittrack/app/FitWidget;->today()Ljava/lang/String;
    move-result-object v6
    const-string v7, "date"
    const/4 v8, 0x0
    invoke-interface {v0, v7, v8}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v7
    invoke-virtual {v6, v7}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v9

    # antrenman satırı
    if-eqz v9, :wk_old
    const-string v6, "workout"
    const-string v7, "Başlamak için dokun"
    invoke-interface {v0, v6, v7}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v7
    goto :wk_set
    :wk_old
    const-string v7, "Güncellemek için dokun"
    :wk_set
    const-string v6, "w_workout"
    invoke-static {p0, v5, v6, v7}, Lcom/fittrack/app/FitWidget;->setText(Landroid/content/Context;Landroid/widget/RemoteViews;Ljava/lang/String;Ljava/lang/CharSequence;)V

    # su (ml)
    const/4 v3, 0x0
    if-eqz v9, :water_zero
    const-string v6, "water"
    invoke-interface {v0, v6, v8}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v3
    :water_zero
    const-string v6, "waterGoal"
    const/16 v7, 0xbb8
    invoke-interface {v0, v6, v7}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v4
    if-gtz v4, :goal_ok
    const/16 v4, 0xbb8
    :goal_ok
    new-instance v6, Ljava/lang/StringBuilder;
    invoke-direct {v6}, Ljava/lang/StringBuilder;-><init>()V
    invoke-virtual {v6, v3}, Ljava/lang/StringBuilder;->append(I)Ljava/lang/StringBuilder;
    const-string v7, " ml"
    invoke-virtual {v6, v7}, Ljava/lang/StringBuilder;->append(Ljava/lang/String;)Ljava/lang/StringBuilder;
    invoke-virtual {v6}, Ljava/lang/StringBuilder;->toString()Ljava/lang/String;
    move-result-object v7
    const-string v6, "w_water"
    invoke-static {p0, v5, v6, v7}, Lcom/fittrack/app/FitWidget;->setText(Landroid/content/Context;Landroid/widget/RemoteViews;Ljava/lang/String;Ljava/lang/CharSequence;)V
    mul-int/lit8 v3, v3, 0x64
    div-int/2addr v3, v4
    const-string v6, "w_water_bar"
    invoke-static {p0, v5, v6, v3}, Lcom/fittrack/app/FitWidget;->setBar(Landroid/content/Context;Landroid/widget/RemoteViews;Ljava/lang/String;I)V

    # protein
    const-string v7, "0 g"
    const/4 v3, 0x0
    if-eqz v9, :p_set
    const-string v6, "protein"
    invoke-interface {v0, v6, v7}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v7
    const-string v6, "proteinPct"
    invoke-interface {v0, v6, v8}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v3
    :p_set
    const-string v6, "w_protein"
    invoke-static {p0, v5, v6, v7}, Lcom/fittrack/app/FitWidget;->setText(Landroid/content/Context;Landroid/widget/RemoteViews;Ljava/lang/String;Ljava/lang/CharSequence;)V
    const-string v6, "w_protein_bar"
    invoke-static {p0, v5, v6, v3}, Lcom/fittrack/app/FitWidget;->setBar(Landroid/content/Context;Landroid/widget/RemoteViews;Ljava/lang/String;I)V

    # kalori
    const-string v7, "0 kcal"
    const/4 v3, 0x0
    if-eqz v9, :k_set
    const-string v6, "kcal"
    invoke-interface {v0, v6, v7}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v7
    const-string v6, "kcalPct"
    invoke-interface {v0, v6, v8}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v3
    :k_set
    const-string v6, "w_kcal"
    invoke-static {p0, v5, v6, v7}, Lcom/fittrack/app/FitWidget;->setText(Landroid/content/Context;Landroid/widget/RemoteViews;Ljava/lang/String;Ljava/lang/CharSequence;)V
    const-string v6, "w_kcal_bar"
    invoke-static {p0, v5, v6, v3}, Lcom/fittrack/app/FitWidget;->setBar(Landroid/content/Context;Landroid/widget/RemoteViews;Ljava/lang/String;I)V

    # dokununca uygulamayı aç (FLAG_IMMUTABLE | FLAG_UPDATE_CURRENT)
    const v10, 0xc000000
    new-instance v6, Landroid/content/Intent;
    const-class v7, Lcom/fittrack/app/MainActivity;
    invoke-direct {v6, p0, v7}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V
    const/4 v7, 0x0
    invoke-static {p0, v7, v6, v10}, Landroid/app/PendingIntent;->getActivity(Landroid/content/Context;ILandroid/content/Intent;I)Landroid/app/PendingIntent;
    move-result-object v6
    const-string v7, "w_root"
    invoke-static {p0, v7}, Lcom/fittrack/app/FitWidget;->idOf(Landroid/content/Context;Ljava/lang/String;)I
    move-result v7
    if-eqz v7, :no_root
    invoke-virtual {v5, v7, v6}, Landroid/widget/RemoteViews;->setOnClickPendingIntent(ILandroid/app/PendingIntent;)V
    :no_root

    # +250 ml su butonu
    new-instance v6, Landroid/content/Intent;
    const-class v7, Lcom/fittrack/app/FitWidget;
    invoke-direct {v6, p0, v7}, Landroid/content/Intent;-><init>(Landroid/content/Context;Ljava/lang/Class;)V
    const-string v7, "com.fittrack.app.ADD_WATER"
    invoke-virtual {v6, v7}, Landroid/content/Intent;->setAction(Ljava/lang/String;)Landroid/content/Intent;
    const/4 v7, 0x1
    invoke-static {p0, v7, v6, v10}, Landroid/app/PendingIntent;->getBroadcast(Landroid/content/Context;ILandroid/content/Intent;I)Landroid/app/PendingIntent;
    move-result-object v6
    const-string v7, "w_add"
    invoke-static {p0, v7}, Lcom/fittrack/app/FitWidget;->idOf(Landroid/content/Context;Ljava/lang/String;)I
    move-result v7
    if-eqz v7, :no_add
    invoke-virtual {v5, v7, v6}, Landroid/widget/RemoteViews;->setOnClickPendingIntent(ILandroid/app/PendingIntent;)V
    :no_add

    # tüm widget örneklerini güncelle
    new-instance v6, Landroid/content/ComponentName;
    const-class v7, Lcom/fittrack/app/FitWidget;
    invoke-direct {v6, p0, v7}, Landroid/content/ComponentName;-><init>(Landroid/content/Context;Ljava/lang/Class;)V
    invoke-static {p0}, Landroid/appwidget/AppWidgetManager;->getInstance(Landroid/content/Context;)Landroid/appwidget/AppWidgetManager;
    move-result-object v7
    invoke-virtual {v7, v6, v5}, Landroid/appwidget/AppWidgetManager;->updateAppWidget(Landroid/content/ComponentName;Landroid/widget/RemoteViews;)V
    return-void
.end method

.method public onUpdate(Landroid/content/Context;Landroid/appwidget/AppWidgetManager;[I)V
    .locals 0
    invoke-static {p1}, Lcom/fittrack/app/FitWidget;->refresh(Landroid/content/Context;)V
    return-void
.end method

.method public onReceive(Landroid/content/Context;Landroid/content/Intent;)V
    .locals 6
    invoke-super {p0, p1, p2}, Landroid/appwidget/AppWidgetProvider;->onReceive(Landroid/content/Context;Landroid/content/Intent;)V

    invoke-virtual {p2}, Landroid/content/Intent;->getAction()Ljava/lang/String;
    move-result-object v0
    const-string v1, "com.fittrack.app.ADD_WATER"
    invoke-virtual {v1, v0}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v0
    if-eqz v0, :end

    invoke-static {p1}, Lcom/fittrack/app/FitWidget;->prefs(Landroid/content/Context;)Landroid/content/SharedPreferences;
    move-result-object v0
    invoke-interface {v0}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;
    move-result-object v4
    invoke-static {}, Lcom/fittrack/app/FitWidget;->today()Ljava/lang/String;
    move-result-object v1
    const-string v5, "date"
    const/4 v3, 0x0
    invoke-interface {v0, v5, v3}, Landroid/content/SharedPreferences;->getString(Ljava/lang/String;Ljava/lang/String;)Ljava/lang/String;
    move-result-object v3
    invoke-virtual {v1, v3}, Ljava/lang/String;->equals(Ljava/lang/Object;)Z
    move-result v3
    if-eqz v3, :new_day

    const-string v5, "water"
    const/4 v2, 0x0
    invoke-interface {v0, v5, v2}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v2
    goto :add

    :new_day
    # yeni gün: özeti sıfırla
    invoke-interface {v4, v5, v1}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
    const-string v5, "workout"
    const-string v3, "Güncellemek için dokun"
    invoke-interface {v4, v5, v3}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
    const-string v5, "protein"
    const-string v3, "0 g"
    invoke-interface {v4, v5, v3}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
    const-string v5, "kcal"
    const-string v3, "0 kcal"
    invoke-interface {v4, v5, v3}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
    const/4 v3, 0x0
    const-string v5, "proteinPct"
    invoke-interface {v4, v5, v3}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    const-string v5, "kcalPct"
    invoke-interface {v4, v5, v3}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    const/4 v2, 0x0

    :add
    add-int/lit16 v2, v2, 0xfa
    const-string v5, "water"
    invoke-interface {v4, v5, v2}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    const-string v5, "pending"
    const/4 v3, 0x0
    invoke-interface {v0, v5, v3}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v3
    add-int/lit16 v3, v3, 0xfa
    invoke-interface {v4, v5, v3}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    invoke-interface {v4}, Landroid/content/SharedPreferences$Editor;->commit()Z

    invoke-static {p1}, Lcom/fittrack/app/FitWidget;->refresh(Landroid/content/Context;)V
    :end
    return-void
.end method
