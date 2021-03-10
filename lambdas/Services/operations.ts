import { driver, process as gprocess, structure } from "gremlin";

import * as gremlin from "gremlin";
const __ = gremlin.process.statics;
import * as async from "async";
import { Context, Callback, AppSyncResolverEvent } from "aws-lambda";
import {
  MutationAddCuisineArgs,
  MutationAddFriendArgs,
  MutationAddPersonArgs,
  MutationAddRatingArgs,
  MutationAddRestaurantArgs,
  MutationAddReviewArgs,
  QueryLatestReviewsArgs,
  QueryRelationArgs,
  QueryRestaurantRatingArgs,
  QueryRestaurantRecommendationsByFriendsArgs,
  QueryReviewedInLastXDaysArgs,
  QuerySearchBestWithCusineAndLocationArgs,
  QueryTopTenArgs,
} from "../../types";
class Operations {
  private connection: driver.DriverRemoteConnection;
  private g: gprocess.GraphTraversalSource;
  url: string;
  endPoint: string;
  port: string;

  constructor(endPoint: string, port: string) {
    this.port = port;
    this.endPoint = endPoint;
    this.url = "wss://" + endPoint + ":" + port + "/gremlin";
    this.connection = new driver.DriverRemoteConnection(this.url, {});
    this.g = gprocess.traversal().withRemote(this.connection);
  }
  // async addPerson(
  //   event: AppSyncResolverEvent<MutationAddPersonArgs>,
  //   context: Context
  // ) {
  //   const person = {
  //     ...event.arguments,
  //     userId: context.awsRequestId,
  //   };
  //   const query = this.objectToVertexProperties(this.g.addV("person"), person);
  //   console.log(query, "----Query----");
  //   const result = await query.next();
  //   console.log(result, "-----Results-----");
  //   return result.value;
  // }

  async addPerson(
    event: AppSyncResolverEvent<MutationAddPersonArgs>,
    context: Context
  ) {
    const awsRequestId = context.awsRequestId;
    console.log(event);
    const userId = event.arguments.userId
      ? event.arguments.userId
      : event.identity?.username;
    const person = {
      name: event.arguments.name,
      email: event.arguments.email,
      userId: userId,
    };
    const validationQuery = this.g.V().has("person", "userId", userId).toList();
    const validationResult = await validationQuery;
    if (validationResult.length > 0) {
      throw new Error("This user already exists");
    }

    const query = this.chainProperties(this.g.addV("person"), person)
      .valueMap()
      .next();

    // const query = this.g.V().count().next();
    const result = await query;
    console.log(result, "result");
    const parsedResult = this.mapToJson(result);

    return parsedResult;
  }
  async addRestaurant(
    event: AppSyncResolverEvent<MutationAddRestaurantArgs>,
    context: Context
  ) {
    const awsRequestId = context.awsRequestId;
    const restaurant = {
      name: event.arguments.restaurant?.name,
      restaurantId: awsRequestId,
      address: event.arguments.restaurant?.address,
      distance: event.arguments.restaurant?.distance,
    };
    const query = this.chainProperties(this.g.addV("restaurant"), restaurant)

      .valueMap()
      .next();

    // const query = this.g.V().count().next();
    const result = await query;
    const parsedResult = this.mapToJson(result);

    return parsedResult;
  }
  async addCuisine(
    event: AppSyncResolverEvent<MutationAddCuisineArgs>,
    context: Context
  ) {
    const awsRequestId = context.awsRequestId;
    const cuisine = {
      name: event.arguments.cuisine?.name,
      cuisineId: awsRequestId,
      restaurantId: event.arguments.cuisine?.restaurantId,
    };
    const query: gremlin.process.GraphTraversal = this.chainProperties(
      this.g.addV("cuisine"),
      cuisine
    )
      .addE("serves")
      .from_(this.g.V().has("restaurant", "restaurantId", cuisine.restaurantId))
      // Confirming and getting Vertex from the edge
      .inV()
      .valueMap();
    const result = await query.next();
    const parsedResult = this.mapToJson(result);

    return parsedResult;
  }
  async addReview(
    event: AppSyncResolverEvent<MutationAddReviewArgs>,
    context: Context
  ) {
    const awsRequestId = context.awsRequestId;
    const review = {
      text: event.arguments.review?.text,
      createdAt: Date.now().toString(),
      reviewId: awsRequestId,
      userId: event.identity?.username, // from context
      restaurantId: event.arguments.review?.restaurantId,
    };
    const query: gremlin.process.GraphTraversal = this.chainProperties(
      this.g.addV("review"),
      review
    )
      .union(
        __.addE("about").to(
          this.g.V().has("restaurant", "restaurantId", review.restaurantId)
        ),
        __.addE("writes").from_(
          this.g.V().has("person", "userId", review.userId)
        )
      )
      .outV()
      .valueMap();

    const result = await query.next();
    const parsedResult = this.mapToJson(result);
    return parsedResult;
  }
  async addFriend(
    event: AppSyncResolverEvent<MutationAddFriendArgs>,
    context: Context
  ) {
    const friend = {
      friendId: event.arguments.userId,
      userId: event.identity?.username,
    };

    const query = this.g
      .addE("friend")
      .from_(this.g.V().has("person", "userId", friend.userId))
      .to(this.g.V().has("person", "userId", friend.friendId))
      .inV()
      .valueMap();
    const result = await query.next();
    const parsedResult = this.mapToJson(result);

    return parsedResult;
  }
  async addRating(
    event: AppSyncResolverEvent<MutationAddRatingArgs>,
    context: Context
  ) {
    const rating = {
      userId: event.identity?.username,
      reviewId: event.arguments.reviewId,
      recommends: event.arguments.recommends,
    };

    const query = this.g
      .addE(rating.recommends ? "likes" : "dislikes")
      .from_(this.g.V().has("person", "userId", rating.userId))
      .to(this.g.V().has("review", "reviewId", rating.reviewId))
      .inV()
      .inE()
      .store("a")
      .hasLabel("likes")
      .count()
      .store("likes")
      .cap("a")
      .unfold()
      .hasLabel("dislikes")
      .count()
      .store("dislikes")
      .select("likes", "dislikes")
      .next();
    const results = this.mapToJson(await query);
    results.total = results.likes + results.dislikes;
    results.commulative = results.likes - results.dislikes;
    return results;
  }

  async friends(event: AppSyncResolverEvent<any>, context: Context) {
    const id = event.identity?.username;
    const query = this.g
      .V()
      .has("person", "userId", id)
      .bothE()
      .hasLabel("friend")
      .otherV()
      .dedup()
      .valueMap()
      .toList();

    return this.mapToJson(await query);
  }
  async friendsOfFriends(event: AppSyncResolverEvent<any>, context: Context) {
    const id = event.identity?.username;
    const query = this.g
      .V()
      .has("person", "userId", id)
      .bothE()
      .hasLabel("friend")
      .otherV()
      .dedup()
      .bothE()
      .hasLabel("friend")
      .otherV()
      .dedup()
      .valueMap()
      .toList();

    // .next();

    // .toList();
    return this.mapToJson(await query);
  }
  async relation(
    event: AppSyncResolverEvent<QueryRelationArgs>,
    context: Context
  ) {
    const people = {
      //from context
      userId: event.identity?.username,
      targetUserId: event.arguments.targetUserId,
    };
    const query = this.g
      .V()
      .has("person", "userId", people.userId)
      .bothE()
      .as("x")
      .otherV()
      .has("person", "userId", people.targetUserId)
      .select("x")
      .label()
      .next();
    const result = await query;
    if (result.value != null) {
      return result.value;
    } else {
      return "no relation";
    }
  }
  async searchBestWithCusineAndLocation(
    event: AppSyncResolverEvent<QuerySearchBestWithCusineAndLocationArgs>,
    context: Context
  ) {
    console.log(event.arguments);
    const cuisine = event.arguments.name;
    const distanceOffset = event.arguments.distanceOffset;
    const query = this.g
      .V()
      .has("cuisine", "name", cuisine)
      .inE()
      .outV()
      .where(__.values("distance").is(gremlin.process.P.lte(distanceOffset)))
      .order()
      .by(
        __.inE().hasLabel("about").otherV().inE().hasLabel("likes").count(),
        gremlin.process.order.desc
      )
      .limit(1)
      .valueMap()
      .next();
    const result = this.mapToJson(await query);
    console.log(result);
    if (result) {
      return result;
    } else {
      throw new Error("Couldnt find anything close to you");
    }
    // return this.mapToJson(await query);
  }
  async topTen(event: AppSyncResolverEvent<QueryTopTenArgs>, context: Context) {
    const distanceOffset = event.arguments.distanceOffset;
    const query = this.g
      .V()
      .hasLabel("restaurant")
      .where(__.values("distance").is(gremlin.process.P.lte(distanceOffset)))
      // group by gives us the count of likesfor each
      .order()
      .by(
        __.inE().hasLabel("about").otherV().inE().hasLabel("likes").count(),
        gremlin.process.order.desc
      )
      //
      .limit(10)
      .unfold()
      .valueMap()
      .toList();
    return this.mapToJson(await query);
  }
  async latestReviews(
    event: AppSyncResolverEvent<QueryLatestReviewsArgs>,
    context: Context
  ) {
    const restaurantId = event.arguments.restaurantId;
    const query = this.g
      .V()
      .has("restaurant", "restaurantId", restaurantId)
      .inE()
      .hasLabel("about")
      .otherV()
      .order()
      .by(__.values("createdAt"), gremlin.process.order.desc)
      .limit(10)
      .valueMap()
      .toList();
    return this.mapToJson(await query);
  }
  async restaurantRecommendationsByFriends(
    event: AppSyncResolverEvent<QueryRestaurantRecommendationsByFriendsArgs>,
    context: Context
  ) {
    //  const userId="6434dcbd-88e2-4258-81a7-d30be14347c2"
    const friendId = event.arguments.friendId;
    const query = this.g
      .V()
      .has("person", "userId", friendId)
      .outE()
      .hasLabel("likes")
      .otherV()
      .outE()
      .hasLabel("about")
      .otherV()
      .dedup()
      .valueMap()
      .toList();
    return this.mapToJson(await query);
  }
  async reviewedInLastXDays(
    event: AppSyncResolverEvent<QueryReviewedInLastXDaysArgs>,
    context: Context
  ) {
    const days = event.arguments.days;
    const targetTime = Date.now() - days * 24 * 60 * 1000;
    console.log(targetTime);
    const id = event.identity?.username;

    const query = this.g
      .V()
      .has("person", "userId", id)
      .bothE()
      .hasLabel("friend")
      .otherV()
      .dedup()
      .outE()
      .hasLabel("writes")
      .inV()
      .where(
        __.values("createdAt").is(gremlin.process.P.gte(targetTime.toString()))
      )
      .outE("about")
      .inV()
      .valueMap()
      .toList();
    return this.mapToJson(await query);
  }
  async restaurantRating(
    event: AppSyncResolverEvent<QueryRestaurantRatingArgs>,
    context: Context
  ) {
    const restaurantId = event.arguments.restaurantId;
    const query = this.g
      .V()
      .has("restaurant", "restaurantId", restaurantId)
      .inE()
      .hasLabel("about")
      .otherV()
      .inE()
      .store("a")
      .hasLabel("likes")
      .count()
      .store("likes")
      .cap("a")
      .unfold()
      .hasLabel("dislikes")
      .count()
      .store("dislikes")
      .select("likes", "dislikes")
      .next();
    const results = this.mapToJson(await query);
    results.total = results.likes + results.dislikes;
    results.commulative = results.likes - results.dislikes;
    return results;
  }
  // All of them need some kind of check for validation but it's a pain so i'll see what I can do later

  private mapToJson(map: any) {
    // O(m*n) complexity :(
    const converter = (val: any) => {
      //might need changing for arrays
      console.log(typeof val);
      const obj = (<any>Object).fromEntries(val);
      console.log(obj, "___________culprit");
      const keys = Object.keys(obj);
      const x = {};
      keys.forEach(
        (key) => ((x as any)[key] = (obj as any)[key].values().next().value)
      );
      return x;
    };
    if (Array.isArray(map)) {
      const ar: any = [];
      map.forEach((val) => {
        ar.push(converter(val));
      });
      return ar;
    } else {
      console.log("Not Array");
      return converter(map.value);
    }
  }
  private chainProperties(vertex: any, obj: Object) {
    let baseQuery = vertex;
    for (const key in obj) {
      baseQuery = baseQuery.property(key, (obj as any)[key]);
    }
    return baseQuery as gremlin.process.GraphTraversal;
  }
  private execute(query: any) {
    return async.retry(
      {
        times: 1,
        interval: 1000,
        errorFilter: (err: any) => {
          // Add filters here to determine whether error can be retried
          console.warn("Determining whether retriable error: " + err.message);
          // Check for connection issues
          if (err.message.startsWith("WebSocket is not open")) {
            console.warn("Reopening connection");
            this.connection.close();
            this.connection = new driver.DriverRemoteConnection(this.url, {});
            this.g = gprocess.traversal().withRemote(this.connection);
            return true;
          }
          // Check for ConcurrentModificationException
          if (err.message.includes("ConcurrentModificationException")) {
            console.warn(
              "Retrying query because of ConcurrentModificationException"
            );
            return true;
          }
          // Check for ReadOnlyViolationException
          if (err.message.includes("ReadOnlyViolationException")) {
            console.warn(
              "Retrying query because of ReadOnlyViolationException"
            );
            return true;
          }
          return false;
        },
      },
      query
    );
  }
}
export default Operations;
