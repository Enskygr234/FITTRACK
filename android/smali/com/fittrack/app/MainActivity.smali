.class public Lcom/fittrack/app/MainActivity;
.super Landroid/app/Activity;
.source "MainActivity.java"

# FITTRACK — web uygulamasını (assets/www) tam ekran WebView içinde açar.

.field private web:Landroid/webkit/WebView;
.field public fileCb:Landroid/webkit/ValueCallback;
.field public pendingPerm:Landroid/webkit/PermissionRequest;

.method public constructor <init>()V
    .locals 0
    invoke-direct {p0}, Landroid/app/Activity;-><init>()V
    return-void
.end method

.method protected onCreate(Landroid/os/Bundle;)V
    .locals 4

    invoke-super {p0, p1}, Landroid/app/Activity;->onCreate(Landroid/os/Bundle;)V

    # Durum/gezinme çubuğu rengi: #06080E
    invoke-virtual {p0}, Lcom/fittrack/app/MainActivity;->getWindow()Landroid/view/Window;
    move-result-object v0
    const v1, -0xf9f7f2
    invoke-virtual {v0, v1}, Landroid/view/Window;->setStatusBarColor(I)V
    invoke-virtual {v0, v1}, Landroid/view/Window;->setNavigationBarColor(I)V

    new-instance v0, Landroid/webkit/WebView;
    invoke-direct {v0, p0}, Landroid/webkit/WebView;-><init>(Landroid/content/Context;)V
    iput-object v0, p0, Lcom/fittrack/app/MainActivity;->web:Landroid/webkit/WebView;
    invoke-virtual {v0, v1}, Landroid/webkit/WebView;->setBackgroundColor(I)V

    invoke-virtual {v0}, Landroid/webkit/WebView;->getSettings()Landroid/webkit/WebSettings;
    move-result-object v2
    const/4 v3, 0x1
    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setJavaScriptEnabled(Z)V
    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setDomStorageEnabled(Z)V
    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setAllowFileAccess(Z)V
    const/4 v3, 0x0
    invoke-virtual {v2, v3}, Landroid/webkit/WebSettings;->setMediaPlaybackRequiresUserGesture(Z)V

    # widget köprüsü
    new-instance v2, Lcom/fittrack/app/Bridge;
    invoke-direct {v2, p0}, Lcom/fittrack/app/Bridge;-><init>(Landroid/content/Context;)V
    const-string v3, "FitBridge"
    invoke-virtual {v0, v2, v3}, Landroid/webkit/WebView;->addJavascriptInterface(Ljava/lang/Object;Ljava/lang/String;)V

    new-instance v2, Landroid/webkit/WebViewClient;
    invoke-direct {v2}, Landroid/webkit/WebViewClient;-><init>()V
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setWebViewClient(Landroid/webkit/WebViewClient;)V

    # dosya seçici + kamera izni
    new-instance v2, Lcom/fittrack/app/FitChrome;
    invoke-direct {v2, p0}, Lcom/fittrack/app/FitChrome;-><init>(Lcom/fittrack/app/MainActivity;)V
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->setWebChromeClient(Landroid/webkit/WebChromeClient;)V

    invoke-virtual {p0, v0}, Lcom/fittrack/app/MainActivity;->setContentView(Landroid/view/View;)V

    if-eqz p1, :load
    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->restoreState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;
    move-result-object v2
    if-nez v2, :done

    :load
    const-string v2, "file:///android_asset/www/index.html"
    invoke-virtual {v0, v2}, Landroid/webkit/WebView;->loadUrl(Ljava/lang/String;)V

    :done
    return-void
.end method

.method protected onSaveInstanceState(Landroid/os/Bundle;)V
    .locals 1
    iget-object v0, p0, Lcom/fittrack/app/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :skip
    invoke-virtual {v0, p1}, Landroid/webkit/WebView;->saveState(Landroid/os/Bundle;)Landroid/webkit/WebBackForwardList;
    :skip
    invoke-super {p0, p1}, Landroid/app/Activity;->onSaveInstanceState(Landroid/os/Bundle;)V
    return-void
.end method

.method public onBackPressed()V
    .locals 2
    iget-object v0, p0, Lcom/fittrack/app/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :exit
    invoke-virtual {v0}, Landroid/webkit/WebView;->canGoBack()Z
    move-result v1
    if-eqz v1, :exit
    invoke-virtual {v0}, Landroid/webkit/WebView;->goBack()V
    return-void

    :exit
    invoke-super {p0}, Landroid/app/Activity;->onBackPressed()V
    return-void
.end method

.method protected onPause()V
    .locals 1
    invoke-super {p0}, Landroid/app/Activity;->onPause()V
    iget-object v0, p0, Lcom/fittrack/app/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :skip
    invoke-virtual {v0}, Landroid/webkit/WebView;->onPause()V
    :skip
    return-void
.end method

.method protected onResume()V
    .locals 3
    invoke-super {p0}, Landroid/app/Activity;->onResume()V
    iget-object v0, p0, Lcom/fittrack/app/MainActivity;->web:Landroid/webkit/WebView;
    if-eqz v0, :skip
    invoke-virtual {v0}, Landroid/webkit/WebView;->onResume()V
    # widget'tan eklenen suyu uygulamaya aktar
    const-string v1, "window.fitOnResume&&window.fitOnResume()"
    const/4 v2, 0x0
    invoke-virtual {v0, v1, v2}, Landroid/webkit/WebView;->evaluateJavascript(Ljava/lang/String;Landroid/webkit/ValueCallback;)V
    :skip
    return-void
.end method

.method protected onActivityResult(IILandroid/content/Intent;)V
    .locals 2
    invoke-super {p0, p1, p2, p3}, Landroid/app/Activity;->onActivityResult(IILandroid/content/Intent;)V
    const/4 v0, 0x7
    if-ne p1, v0, :done
    iget-object v0, p0, Lcom/fittrack/app/MainActivity;->fileCb:Landroid/webkit/ValueCallback;
    if-eqz v0, :done
    invoke-static {p2, p3}, Landroid/webkit/WebChromeClient$FileChooserParams;->parseResult(ILandroid/content/Intent;)[Landroid/net/Uri;
    move-result-object v1
    invoke-interface {v0, v1}, Landroid/webkit/ValueCallback;->onReceiveValue(Ljava/lang/Object;)V
    const/4 v0, 0x0
    iput-object v0, p0, Lcom/fittrack/app/MainActivity;->fileCb:Landroid/webkit/ValueCallback;
    :done
    return-void
.end method

.method public onRequestPermissionsResult(I[Ljava/lang/String;[I)V
    .locals 3
    invoke-super {p0, p1, p2, p3}, Landroid/app/Activity;->onRequestPermissionsResult(I[Ljava/lang/String;[I)V
    const/16 v0, 0x8
    if-ne p1, v0, :done
    iget-object v0, p0, Lcom/fittrack/app/MainActivity;->pendingPerm:Landroid/webkit/PermissionRequest;
    if-eqz v0, :done
    const/4 v1, 0x0
    iput-object v1, p0, Lcom/fittrack/app/MainActivity;->pendingPerm:Landroid/webkit/PermissionRequest;
    array-length v1, p3
    if-lez v1, :deny
    const/4 v1, 0x0
    aget v1, p3, v1
    if-nez v1, :deny
    invoke-virtual {v0}, Landroid/webkit/PermissionRequest;->getResources()[Ljava/lang/String;
    move-result-object v2
    invoke-virtual {v0, v2}, Landroid/webkit/PermissionRequest;->grant([Ljava/lang/String;)V
    return-void
    :deny
    invoke-virtual {v0}, Landroid/webkit/PermissionRequest;->deny()V
    :done
    return-void
.end method
