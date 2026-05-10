# DevImpact




### 🧠 Main
```
 compareUsers(user1, user2):

    score1 = calculateUserScore(user1)
    score2 = calculateUserScore(user2)

    IF score1 > score2:
        RETURN user1 as winner
    ELSE:
        RETURN user2 as winner
```

### 🧠 User Score
```
 calculateUserScore(user):

    repos = getUserRepositories(user) // get the first 100 top repos
    prs = getUserPullRequests(user) // get the latest 100 top merged PRs that's not merged to the user repo
    contributions = getUserContributions(user)

    repoScore = calculateRepoScore(repos)
    prScore = calculatePRScore(prs, user)
    contributionScore = calculateContributionScore(contributions)

    finalScore =
        repoScore * 0.4 +
        prScore * 0.4 +
        contributionScore * 0.2

    RETURN finalScore
```

### 📦 Repository Score
```
 calculateRepoScore(repos):

    scores = []

    FOR EACH repo IN repos:
        score =
            log(repo.stars + 1) * 5 +
            log(repo.forks + 1) * 3 +
            log(repo.watchers + 1) * 2

        ADD score TO scores

    SORT scores DESC

    total = 0

    FOR i FROM 0 TO length(scores)-1:
        IF i < 5:
            weight = 1                // top repos matter most
        ELSE:
            weight = 0.1              // others have low impact

        total += scores[i] * weight

    RETURN total
```


### 🔥 Pull Request Score
```
 calculatePRScore(prs, username):

    groupedPRs = groupPRsByRepository(prs)

    totalScore = 0

    FOR EACH repo IN groupedPRs:

        repoPRs = groupedPRs[repo]

        prScores = []

        FOR EACH pr IN repoPRs:

            // ❌ Ignore PRs to user's own repo
            IF pr.repoOwner == username:
                CONTINUE

            // ❌ Ignore non-merged PRs
            IF NOT pr.isMerged:
                CONTINUE

            // ✅ Base score (only for valid PRs)
            base =
                log(pr.repoStars + 1) * 2

            // Optional: PR size factor (recommended)
            sizeFactor = log(pr.additions + pr.deletions + 1)

            score = base * sizeFactor

            ADD score TO prScores

        // If no valid PRs, skip repo
        IF length(prScores) == 0:
            CONTINUE

        SORT prScores DESC

        // diminishing returns inside same repo
        repoTotal = 0

        FOR i FROM 0 TO length(prScores)-1:
            weight = 1 / (i + 1)
            repoTotal += prScores[i] * weight

        totalScore += repoTotal

    RETURN totalScore
```


### 🌍 Contribution Score (Activity)
```
 calculateContributionScore(contributions):

    commits = contributions.commits // public commits
    prs = contributions.prs
    issues = contributions.issues // public issues

    score =
        commits * 0.5 +
        prs * 2 +
        issues * 0.3

    RETURN score
```