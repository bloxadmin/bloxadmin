declare type RobloxID = string | number;

declare type JsonString<T> = string & { __type_info?: T};
declare type InferJsonString<T> = T extends JsonString<infer U> ? U : never;
