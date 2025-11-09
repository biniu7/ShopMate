/**
 * DashboardSkeleton - Skeleton loader dla dashboardu
 * Wyświetla szkielety wszystkich sekcji podczas ładowania danych
 */

export function DashboardSkeleton() {
  return (
    <div className="dashboard-skeleton">
      {/* Header Skeleton */}
      <div className="dashboard-header-skeleton mb-8">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>

      {/* Stats Skeleton */}
      <div className="stats-skeleton mb-8">
        <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={`stat-${i}`}
              className="stat-card-skeleton h-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="quick-actions-skeleton mb-8">
        <div className="quick-actions-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={`action-${i}`}
              className="action-button-skeleton h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>

      {/* Content Grid */}
      <div className="dashboard-content-skeleton grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Recipes Skeleton */}
        <div className="recipes-skeleton">
          <div className="section-header-skeleton mb-4 flex items-center justify-between">
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="recipes-grid space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={`recipe-${i}`}
                className="recipe-card-skeleton h-28 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>

        {/* Upcoming Meals Skeleton */}
        <div className="meals-skeleton">
          <div className="section-header-skeleton mb-4 flex items-center justify-between">
            <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
          <div className="meals-timeline space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={`meal-${i}`}
                className="meal-item-skeleton h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
