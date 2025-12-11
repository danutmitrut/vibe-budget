import { autoCategorizeByCategoryName } from "./lib/auto-categorization/categories-rules";

const result = autoCategorizeByCategoryName("Netflix Subscription");
console.log("Netflix Subscription →", result);
