# MongoDB Aggregation Pipelines — Analytics Module

## Weekly Progress Pipeline

```javascript
[
  // Stage 1: $match — Filter documents to user's logs within date range
  { $match: { userId: ObjectId("..."), loggedAt: { $gte: startDate } } },

  // Stage 2: $group — Group by ISO week, compute aggregates
  {
    $group: {
      _id: { $dateToString: { format: '%G-%V', date: '$loggedAt' } },
      avgWeight: { $avg: '$weight' },
      totalWater: { $sum: '$waterIntake' },
      totalCalories: { $sum: '$caloriesConsumed' },
      logCount: { $sum: 1 },
    },
  },

  // Stage 3: $sort — Order chronologically by week
  { $sort: { _id: 1 } },
]
```

| Stage | Purpose |
|-------|---------|
| `$match` | Reduces dataset early (uses index on `userId` + `loggedAt`) |
| `$group` | Aggregates metrics per week using `$avg` and `$sum` |
| `$sort` | Returns time-series data in chronological order |

## Monthly Progress Pipeline

```javascript
[
  { $match: { userId: ObjectId("..."), loggedAt: { $gte: yearStart } } },
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m', date: '$loggedAt' } },
      avgWeight: { $avg: '$weight' },
      avgBodyFat: { $avg: '$bodyFat' },
      totalWater: { $sum: '$waterIntake' },
      totalCalories: { $sum: '$caloriesConsumed' },
    },
  },
  { $sort: { _id: 1 } },
]
```

## Calories Burned Pipeline (Workout Sessions)

```javascript
[
  { $match: { userId: ObjectId("..."), completedAt: { $gte: start, $lte: end } } },
  { $group: { _id: null, total: { $sum: '$caloriesBurned' } } },
]
```

## Workout Consistency

Computed in service layer:
- `weeklyWorkouts` = count of sessions this week
- `monthlyWorkouts` = count of sessions this month
- `consistencyScore` = min(100, (weeklyWorkouts / 4) * 100)

## Interview Points

- **Why `$match` first?** MongoDB can use indexes; reduces documents for downstream stages
- **Why `$group`?** Single pass aggregation vs. multiple queries in application code
- **Why cache analytics?** Expensive aggregations; TTL-based invalidation on progress updates
