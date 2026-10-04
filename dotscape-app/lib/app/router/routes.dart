abstract final class Routes {
  static const onboarding = '/welcome';
  static const home = '/';
  static const explore = '/explore';
  static const create = '/create';
  static const saved = '/saved';
  static const wallpaperPattern = '/wallpaper/:id';

  static String wallpaper(String id) => '/wallpaper/$id';
}
