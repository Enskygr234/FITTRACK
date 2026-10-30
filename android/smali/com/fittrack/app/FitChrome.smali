.class public Lcom/fittrack/app/FitChrome;
.super Landroid/webkit/WebChromeClient;
.source "FitChrome.java"

# Dosya seçici (fotoğraf/yedek) ve kamera izni (barkod tarama) desteği

.field private final act:Lcom/fittrack/app/MainActivity;

.method public constructor <init>(Lcom/fittrack/app/MainActivity;)V
    .locals 0
    invoke-direct {p0}, Landroid/webkit/WebChromeClient;-><init>()V
    iput-object p1, p0, Lcom/fittrack/app/FitChrome;->act:Lcom/fittrack/app/MainActivity;
    return-void
.end method

.method public onShowFileChooser(Landroid/webkit/WebView;Landroid/webkit/ValueCallback;Landroid/webkit/WebChromeClient$FileChooserParams;)Z
    .locals 3
    iget-object v0, p0, Lcom/fittrack/app/FitChrome;->act:Lcom/fittrack/app/MainActivity;
    iget-object v1, v0, Lcom/fittrack/app/MainActivity;->fileCb:Landroid/webkit/ValueCallback;
    if-eqz v1, :no_old
    const/4 v2, 0x0
    invoke-interface {v1, v2}, Landroid/webkit/ValueCallback;->onReceiveValue(Ljava/lang/Object;)V
    :no_old
    iput-object p2, v0, Lcom/fittrack/app/MainActivity;->fileCb:Landroid/webkit/ValueCallback;
    :try_start
    invoke-virtual {p3}, Landroid/webkit/WebChromeClient$FileChooserParams;->createIntent()Landroid/content/Intent;
    move-result-object v1
    const/4 v2, 0x7
    invoke-virtual {v0, v1, v2}, Lcom/fittrack/app/MainActivity;->startActivityForResult(Landroid/content/Intent;I)V
    :try_end
    .catch Ljava/lang/Exception; {:try_start .. :try_end} :failed
    const/4 v0, 0x1
    return v0
    :failed
    const/4 v1, 0x0
    iput-object v1, v0, Lcom/fittrack/app/MainActivity;->fileCb:Landroid/webkit/ValueCallback;
    const/4 v0, 0x0
    return v0
.end method

.method public onPermissionRequest(Landroid/webkit/PermissionRequest;)V
    .locals 4
    iget-object v0, p0, Lcom/fittrack/app/FitChrome;->act:Lcom/fittrack/app/MainActivity;
    const-string v1, "android.permission.CAMERA"
    invoke-virtual {v0, v1}, Lcom/fittrack/app/MainActivity;->checkSelfPermission(Ljava/lang/String;)I
    move-result v2
    if-nez v2, :ask
    invoke-virtual {p1}, Landroid/webkit/PermissionRequest;->getResources()[Ljava/lang/String;
    move-result-object v3
    invoke-virtual {p1, v3}, Landroid/webkit/PermissionRequest;->grant([Ljava/lang/String;)V
    return-void
    :ask
    iput-object p1, v0, Lcom/fittrack/app/MainActivity;->pendingPerm:Landroid/webkit/PermissionRequest;
    const/4 v2, 0x1
    new-array v3, v2, [Ljava/lang/String;
    const/4 v2, 0x0
    aput-object v1, v3, v2
    const/16 v2, 0x8
    invoke-virtual {v0, v3, v2}, Lcom/fittrack/app/MainActivity;->requestPermissions([Ljava/lang/String;I)V
    return-void
.end method
