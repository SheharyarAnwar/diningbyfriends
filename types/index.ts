export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> &
  { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Person = {
  __typename?: "Person";
  userId: Scalars["String"];
  name: Scalars["String"];
  email: Scalars["String"];
};

export type Review = {
  __typename?: "Review";
  reviewId: Scalars["String"];
  text: Scalars["String"];
  createdAt: Scalars["String"];
  restaurantId: Scalars["String"];
};

export type Restaurant = {
  __typename?: "Restaurant";
  name: Scalars["String"];
  restaurantId: Scalars["String"];
  address: Scalars["String"];
  distance: Scalars["Int"];
};

export type Cuisine = {
  __typename?: "Cuisine";
  name: Scalars["String"];
  cuisineId: Scalars["String"];
  restaurantId: Scalars["String"];
};

export type Query = {
  __typename?: "Query";
  friends: Array<Maybe<Person>>;
  friendsoffriends: Array<Maybe<Person>>;
  relation: Scalars["String"];
  searchBestWithCusineAndLocation?: Maybe<Restaurant>;
  topTen: Array<Maybe<Restaurant>>;
  latestReviews: Array<Maybe<Review>>;
  restaurantRecommendationsByFriends: Array<Maybe<Restaurant>>;
  reviewedInLastXDays: Array<Maybe<Restaurant>>;
  restaurantRating: Rating;
};

export type QueryRelationArgs = {
  targetUserId?: Maybe<Scalars["String"]>;
};

export type QuerySearchBestWithCusineAndLocationArgs = {
  name: Scalars["String"];
  distanceOffset: Scalars["Int"];
};

export type QueryTopTenArgs = {
  distanceOffset: Scalars["Int"];
};

export type QueryLatestReviewsArgs = {
  restaurantId: Scalars["String"];
};

export type QueryRestaurantRecommendationsByFriendsArgs = {
  friendId: Scalars["String"];
};

export type QueryReviewedInLastXDaysArgs = {
  days: Scalars["Int"];
};

export type QueryRestaurantRatingArgs = {
  restaurantId: Scalars["String"];
};

export type Mutation = {
  __typename?: "Mutation";
  addPerson: Person;
  addRestaurant: Restaurant;
  addCuisine: Cuisine;
  addReview: Review;
  addRating: Rating;
  addFriend: Person;
};

export type MutationAddPersonArgs = {
  name: Scalars["String"];
  userId: Scalars["String"];
  email: Scalars["String"];
};

export type MutationAddRestaurantArgs = {
  restaurant?: Maybe<InputRestaurant>;
};

export type MutationAddCuisineArgs = {
  cuisine?: Maybe<InputCuisine>;
};

export type MutationAddReviewArgs = {
  review?: Maybe<InputReview>;
};

export type MutationAddRatingArgs = {
  reviewId?: Maybe<Scalars["String"]>;
  recommends?: Maybe<Scalars["Boolean"]>;
};

export type MutationAddFriendArgs = {
  userId?: Maybe<Scalars["String"]>;
};

export type InputRestaurant = {
  name: Scalars["String"];
  restaurantId: Scalars["String"];
  address: Scalars["String"];
  distance: Scalars["Int"];
};

export type InputCuisine = {
  name: Scalars["String"];
  cuisineId: Scalars["String"];
  restaurantId: Scalars["String"];
};

export type InputReview = {
  reviewId: Scalars["String"];
  text: Scalars["String"];
  createdAt: Scalars["String"];
  restaurantId: Scalars["String"];
};

export type Rating = {
  __typename?: "Rating";
  positiveRating: Scalars["Int"];
  negativeRating: Scalars["Int"];
  totalRating: Scalars["Int"];
  commulativeRating: Scalars["Int"];
};
