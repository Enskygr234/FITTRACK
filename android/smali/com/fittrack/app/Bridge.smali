.class public Lcom/fittrack/app/Bridge;
.super Ljava/lang/Object;
.source "Bridge.java"

# JavaScript köprüsü: web uygulaması günlük özeti widget'a gönderir,
# widget'tan eklenen bekleyen suyu geri alır.

.field private final ctx:Landroid/content/Context;
.field private final act:Landroid/app/Activity;

.method public constructor <init>(Landroid/content/Context;)V
    .locals 1
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    check-cast p1, Landroid/app/Activity;
    iput-object p1, p0, Lcom/fittrack/app/Bridge;->act:Landroid/app/Activity;
    invoke-virtual {p1}, Landroid/content/Context;->getApplicationContext()Landroid/content/Context;
    move-result-object v0
    iput-object v0, p0, Lcom/fittrack/app/Bridge;->ctx:Landroid/content/Context;
    return-void
.end method

# update(tarih, antrenman, suMl, suHedefMl, proteinMetni, proteinYuzde, kaloriMetni, kaloriYuzde)
.method public update(Ljava/lang/String;Ljava/lang/String;IILjava/lang/String;ILjava/lang/String;I)V
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    iget-object v0, p0, Lcom/fittrack/app/Bridge;->ctx:Landroid/content/Context;
    invoke-static {v0}, Lcom/fittrack/app/FitWidget;->prefs(Landroid/content/Context;)Landroid/content/SharedPreferences;
    move-result-object v1
    invoke-interface {v1}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;
    move-result-object v1

    const-string v2, "date"
    invoke-interface {v1, v2, p1}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
    const-string v2, "workout"
    invoke-interface {v1, v2, p2}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
    const-string v2, "water"
    invoke-interface {v1, v2, p3}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    const-string v2, "waterGoal"
    invoke-interface {v1, v2, p4}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    const-string v2, "protein"
    invoke-interface {v1, v2, p5}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
    const-string v2, "proteinPct"
    invoke-interface {v1, v2, p6}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    const-string v2, "kcal"
    invoke-interface {v1, v2, p7}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
    const-string v2, "kcalPct"
    invoke-interface {v1, v2, p8}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    invoke-interface {v1}, Landroid/content/SharedPreferences$Editor;->commit()Z

    invoke-static {v0}, Lcom/fittrack/app/FitWidget;->refresh(Landroid/content/Context;)V
    return-void
.end method

# Widget'tan eklenip henüz uygulamaya aktarılmamış su (ml); okununca sıfırlanır
.method public takePendingWater()I
    .locals 4
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation

    iget-object v0, p0, Lcom/fittrack/app/Bridge;->ctx:Landroid/content/Context;
    invoke-static {v0}, Lcom/fittrack/app/FitWidget;->prefs(Landroid/content/Context;)Landroid/content/SharedPreferences;
    move-result-object v0
    const-string v1, "pending"
    const/4 v2, 0x0
    invoke-interface {v0, v1, v2}, Landroid/content/SharedPreferences;->getInt(Ljava/lang/String;I)I
    move-result v3
    invoke-interface {v0}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;
    move-result-object v0
    invoke-interface {v0, v1, v2}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    invoke-interface {v0}, Landroid/content/SharedPreferences$Editor;->commit()Z
    return v3
.end method

# Android 13+ bildirim izni iste (ana iş parçacığında)
.method public requestNotifPermission()V
    .locals 4
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    sget v0, Landroid/os/Build$VERSION;->SDK_INT:I
    const/16 v1, 0x21
    if-lt v0, v1, :skip
    iget-object v0, p0, Lcom/fittrack/app/Bridge;->act:Landroid/app/Activity;
    new-instance v2, Lcom/fittrack/app/PermRequest;
    const-string v3, "android.permission.POST_NOTIFICATIONS"
    invoke-direct {v2, v0, v3}, Lcom/fittrack/app/PermRequest;-><init>(Landroid/app/Activity;Ljava/lang/String;)V
    invoke-virtual {v0, v2}, Landroid/app/Activity;->runOnUiThread(Ljava/lang/Runnable;)V
    :skip
    return-void
.end method

# setReminders(suAçık, antrenmanAçık, saat, dakika, günMaskesi "1010100")
.method public setReminders(ZZIILjava/lang/String;)V
    .locals 3
    .annotation runtime Landroid/webkit/JavascriptInterface;
    .end annotation
    iget-object v0, p0, Lcom/fittrack/app/Bridge;->ctx:Landroid/content/Context;
    invoke-static {v0}, Lcom/fittrack/app/FitWidget;->prefs(Landroid/content/Context;)Landroid/content/SharedPreferences;
    move-result-object v1
    invoke-interface {v1}, Landroid/content/SharedPreferences;->edit()Landroid/content/SharedPreferences$Editor;
    move-result-object v1
    const-string v2, "remWater"
    invoke-interface {v1, v2, p1}, Landroid/content/SharedPreferences$Editor;->putBoolean(Ljava/lang/String;Z)Landroid/content/SharedPreferences$Editor;
    const-string v2, "remWorkout"
    invoke-interface {v1, v2, p2}, Landroid/content/SharedPreferences$Editor;->putBoolean(Ljava/lang/String;Z)Landroid/content/SharedPreferences$Editor;
    const-string v2, "remHour"
    invoke-interface {v1, v2, p3}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    const-string v2, "remMin"
    invoke-interface {v1, v2, p4}, Landroid/content/SharedPreferences$Editor;->putInt(Ljava/lang/String;I)Landroid/content/SharedPreferences$Editor;
    const-string v2, "remMask"
    invoke-interface {v1, v2, p5}, Landroid/content/SharedPreferences$Editor;->putString(Ljava/lang/String;Ljava/lang/String;)Landroid/content/SharedPreferences$Editor;
    invoke-interface {v1}, Landroid/content/SharedPreferences$Editor;->commit()Z
    invoke-static {v0}, Lcom/fittrack/app/Reminders;->schedule(Landroid/content/Context;)V
    return-void
.end method
