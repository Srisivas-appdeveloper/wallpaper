# Flutter
-keep class io.flutter.app.** { *; }
-keep class io.flutter.plugin.**  { *; }
-keep class io.flutter.util.**  { *; }
-keep class io.flutter.view.**  { *; }
-keep class io.flutter.**  { *; }
-keep class io.flutter.plugins.**  { *; }

# WorkManager & Room (used by Google Mobile Ads SDK)
-keep class androidx.work.** { *; }
-keep class androidx.work.impl.** { *; }
-keep class androidx.work.impl.WorkDatabase_Impl {
    public <init>();
}
-keep class * extends androidx.room.RoomDatabase {
    public <init>();
}
-dontwarn androidx.work.impl.**

# Google Mobile Ads
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.ads.** { *; }
-keep public class com.google.android.gms.ads.initialization.OnInitializationCompleteListener { *; }
-dontwarn com.google.android.gms.ads.**

# Play Core (Flutter deferred components)
-dontwarn com.google.android.play.core.**

