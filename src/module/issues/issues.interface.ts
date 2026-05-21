export interface IIssue {
    "title" : string,
    "description" : string,
    "type" : string,
    "reporter_id" : number
}

export interface IIssueQuery {
  sort?: "newest" | "oldest";
  type?: "bug" | "feature_request";
  status?: "open" | "in_progress" | "resolved";
}