import { Context, Callback, AppSyncResolverEvent } from "aws-lambda";
import * as gremlin from "gremlin";
import DiningByFriends from "./Services/operations";
exports.handler = async (
  event: AppSyncResolverEvent<any>,
  context: Context,
  callback: Callback
) => {
  const dining = new DiningByFriends(
    process.env.NEPTUNE_ENDPOINT!,
    process.env.NEPTUNE_PORT!
  );
  try {
    const fieldName = event.info.fieldName;
    console.log(event.info.fieldName, "Field Name");
    switch (fieldName) {
      case "addPerson":
        const addPersonResponse = await dining.addPerson(event, context);
        console.log("------mAIN", addPersonResponse);
        return addPersonResponse;
      case "addRestaurant":
        const addRestaurantResponse = await dining.addRestaurant(
          event,
          context
        );
        console.log("------mAIN", addRestaurantResponse);
        return addRestaurantResponse;
      case "addCuisine":
        const addCuisineResponse = await dining.addCuisine(event, context);
        console.log("------mAIN", addCuisineResponse);
        return addCuisineResponse;
      case "addReview":
        const addReviewResponse = await dining.addReview(event, context);
        console.log("------mAIN", addReviewResponse);
        return addReviewResponse;
      case "addFriend":
        const addFriendResponse = await dining.addFriend(event, context);
        console.log("------mAIN", addFriendResponse);
        return addFriendResponse;
      case "addRating":
        const addRatingResponse = await dining.addRating(event, context);
        console.log("------mAIN", addRatingResponse);
        return addRatingResponse;
      case "friends":
        const friendsResponse = await dining.friends(event, context);
        console.log("------mAIN", friendsResponse);
        return friendsResponse;
      case "friendsoffriends":
        const friendsOfFriendsResponse = await dining.friendsOfFriends(
          event,
          context
        );
        console.log("------mAIN", friendsOfFriendsResponse);
        return friendsOfFriendsResponse;
      case "relation":
        const relationResponse = await dining.relation(event, context);
        console.log("------mAIN", relationResponse);
        return relationResponse;
      case "searchBestWithCusineAndLocation":
        const searchBestWithCusineAndLocationResponse = await dining.searchBestWithCusineAndLocation(
          event,
          context
        );
        console.log("------mAIN", searchBestWithCusineAndLocationResponse);
        return searchBestWithCusineAndLocationResponse;
      case "topTen":
        const topTenResponse = await dining.topTen(event, context);
        console.log("------mAIN", topTenResponse);
        return topTenResponse;
      case "latestReviews":
        const latestReviewsResponse = await dining.latestReviews(
          event,
          context
        );
        console.log("------mAIN", latestReviewsResponse);
        return latestReviewsResponse;
      case "restaurantRecommendationsByFriends":
        const restaurantRecommendationsByFriendsResponse = await dining.restaurantRecommendationsByFriends(
          event,
          context
        );
        console.log("------mAIN", restaurantRecommendationsByFriendsResponse);
        return restaurantRecommendationsByFriendsResponse;
      case "reviewedInLastXDays":
        const reviewedInLastXDaysResponse = await dining.reviewedInLastXDays(
          event,
          context
        );
        console.log("------mAIN", reviewedInLastXDaysResponse);
        return reviewedInLastXDaysResponse;
      case "restaurantRating":
        const restaurantRatingResponse = await dining.restaurantRating(
          event,
          context
        );
        console.log("------mAIN", restaurantRatingResponse);
        return restaurantRatingResponse;

      default:
        throw new Error("Fieldname doesnt match any given resolver");
      // callback("Fieldname doesnt match any given resolver", null);
    }
  } catch (err) {
    console.log(err);
    throw new Error(err.toString());
    // callback(err, null);
  }
};
