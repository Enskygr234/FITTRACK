.class public Lcom/fittrack/app/PermRequest;
.super Ljava/lang/Object;
.source "PermRequest.java"
.implements Ljava/lang/Runnable;

# Arka plan iş parçacığından ana iş parçacığında izin isteği

.field private final act:Landroid/app/Activity;
.field private final perm:Ljava/lang/String;

.method public constructor <init>(Landroid/app/Activity;Ljava/lang/String;)V
    .locals 0
    invoke-direct {p0}, Ljava/lang/Object;-><init>()V
    iput-object p1, p0, Lcom/fittrack/app/PermRequest;->act:Landroid/app/Activity;
    iput-object p2, p0, Lcom/fittrack/app/PermRequest;->perm:Ljava/lang/String;
    return-void
.end method

.method public run()V
    .locals 4
    iget-object v0, p0, Lcom/fittrack/app/PermRequest;->act:Landroid/app/Activity;
    iget-object v1, p0, Lcom/fittrack/app/PermRequest;->perm:Ljava/lang/String;
    invoke-virtual {v0, v1}, Landroid/app/Activity;->checkSelfPermission(Ljava/lang/String;)I
    move-result v2
    if-eqz v2, :skip
    const/4 v2, 0x1
    new-array v3, v2, [Ljava/lang/String;
    const/4 v2, 0x0
    aput-object v1, v3, v2
    const/16 v2, 0x9
    invoke-virtual {v0, v3, v2}, Landroid/app/Activity;->requestPermissions([Ljava/lang/String;I)V
    :skip
    return-void
.end method
