Feature: sample karate test script
  for help, see: https://github.com/intuit/karate/wiki/IDE-Support

  Background:
    * url 'https://hsxr2i56e5dv3o4zfxclxobk7m.appsync-api.ap-south-1.amazonaws.com/graphql'

    * configure headers = { authorization: 'eyJraWQiOiJ3RXpuOU9lTkkwOXZ4SHpvQjVhN1RlYm1WNnluSE1jTW9BXC9rYjMzUHQxVT0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIwY2U0MDRhOC03ZTA0LTQ4M2YtOGFhMi0zNzgxZTY5OWQzNjAiLCJhdWQiOiI3a2NmazJrbWc3ZG1sNmdnbGI1c2FjdnRiNiIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJldmVudF9pZCI6IjIwNDExZWZjLTc2NGItNGU3YS1hMDRiLWEyN2I1YzJiMDQ2OSIsInRva2VuX3VzZSI6ImlkIiwiYXV0aF90aW1lIjoxNjE1NDE0MjkzLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGgtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aC0xXzlLbE93Q0VrUiIsImNvZ25pdG86dXNlcm5hbWUiOiIwY2U0MDRhOC03ZTA0LTQ4M2YtOGFhMi0zNzgxZTY5OWQzNjAiLCJleHAiOjE2MTU0MTc4OTMsImlhdCI6MTYxNTQxNDI5MywiZW1haWwiOiJzaGVoYXJ5YXIyOEBob3RtYWlsLmNvbSJ9.BQp1pUvNmt_QcoUIkri02JAKCZXwf5J8JP1R-Tpmr_IEsVIzLRUx_rI4e_EERmWpwp_pR68EKW-NnrG2zmYKd7NazXpNZrpNaxpP4kwlhlARvEC43u9bdSLr6UQma6LtfqeKqjxuuD2qcinHoI3EWrO7ftkctqYv1UjKrjBcBf6UWKAF9TkC6VzxcwyTGT9Jab0h1ovpMaWJzhCVCX0ZCNxB3t4YftJSxQAOzUUmGCKtCBovmT833-s-68NE3t0iHHBhfN4eAsb8YE1Twd06ZSJZBCNkpcf5ffadkfd8nXt6XvbUMbX24gY8dI3ccMFU-Ot1i8917-LE4E3z7ZEjqQ' }


  Scenario: Get Friends For Sherry And Look For Zoro
    Given text query =
    """
    {
        friends {
          email
          name
          userId
        }
      }
    """
    And request { query: '#(query)' }
    When method post
    Then status 200
    * print 'response:', response
    * match $.data.friends[*].name contains 'zoro'

  Scenario: Friend of friend must be you yourself
    Given text query =
    """
          {
        friendsoffriends {
          email
          name
          userId
        }
      }
    """
    And request { query: '#(query)' }
    When method post
    Then status 200
    * print 'response:', response
    # * match $.data.friendsoffriends[*].email contains 'sheharyar28@hotmail.com'
    * match $.data.friendsoffriends[*].userId contains '0ce404a8-7e04-483f-8aa2-3781e699d360'
  Scenario:'Latest Reviews Of The Restaurant'
  Given text query =
    """
          {
  latestReviews(restaurantId: "933db694-db29-4d2c-aafb-4a46577134e2") {
    createdAt
    restaurantId
    reviewId
    text
  }
}
    """
    And request { query: '#(query)' }
    When method post
    Then status 200
    * print 'response:', response
    * match $.data.latestReviews[*].reviewId contains 'b8d52f67-6523-4b4a-9b1a-acd4017381af'

  Scenario:'Relation Between X and Y(Me and Zoro)'
    Given text query =
    """
          {
  relation(targetUserId: "1122")
}
    """
    And request { query: '#(query)' }
    When method post
    Then status 200
    * print 'response:', response
    * match $.data.relation == 'friend'


  Scenario:'Restaurant Rating For A Restaurant (doctor saucy)'
    Given text query =
    """
            {
      restaurantRating(restaurantId: "933db694-db29-4d2c-aafb-4a46577134e2") {
        commulative
        dislikes
        likes
        total
      }
    }
    """
    And request { query: '#(query)' }
    When method post
    Then status 200
    * print 'response:', response
    * match $.data.restaurantRating.commulative == 4
  