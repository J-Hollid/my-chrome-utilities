import {canonicalConstraints,canonicalRequirements} from "../data-layer-canonical-schema.js";
import type {Profile} from "../data-layer-specification-project.js";
import type {ProfileConceptProperty} from "./workspace-profile-concepts.js";

export function projectDocumentationProfileConceptProperties(profile:Profile):readonly ProfileConceptProperty[]{
  const requirements=profile.canonicalSchema?canonicalRequirements(profile.canonicalSchema):profile.requirements;
  if(!profile.canonicalSchema)return requirements.map(({path})=>({path}));
  const concepts=new Map(canonicalConstraints(profile.canonicalSchema).map(({path,concept})=>[path,concept]));
  return requirements.map(({path})=>({path,concept:concepts.get(path)}));
}

export function projectDocumentationProfilePaths(profile:Profile):readonly string[]{return projectDocumentationProfileConceptProperties(profile).map(({path})=>path);}
